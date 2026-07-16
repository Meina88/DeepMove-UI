# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**DeepMove** is a web-based HMI (Human-Machine Interface) for CNC machines (mills/routers) running **ESP32 + FluidNC** firmware. It is a fork of [ESP3D-WEBUI 3.0](https://github.com/luc-github/ESP3D-WEBUI) (via michmela44's fork) that has been stripped down and hardcoded to a single target/firmware combination: **CNC / FluidNC**. Unlike upstream ESP3D-WEBUI, this fork no longer supports selecting between printer/CNC/sand-table targets or multiple firmwares (Marlin, GRBL, etc.) at build time — `src/targets/index.ts` imports directly from `./CNC/FluidNC`.

It was designed for the [MillingStation](https://github.com/Meina88/MillingStation) controller but works with any ESP32 board running FluidNC.

The README (in Spanish) describes multi-target/multi-firmware npm scripts (`dev-<system>-<firmware>`, `buildall`, etc.) inherited from upstream documentation — **these no longer exist**. Use the actual scripts in `package.json` (below).

## Commands

```bash
npm install                 # install dependencies (Node LTS, see .nvmrc: 14.16.1 — CI uses Node 22.x)

npm run dev                 # starts the mock backend (server) + webpack-dev-server (front) concurrently
npm run server               # mock ESP32/FluidNC backend only: HTTP on :8080, WS on :8090 (config/server.js)
npm run front                # webpack-dev-server only, serves on http://localhost:8088, proxies to :8080

npm run build                # production build -> dist/ (index.html.gz + bundle analyzer reports)

npm run type-check           # tsc --noEmit
npm run lint                 # eslint src --ext .ts,.tsx
npm run lint:fix             # eslint --fix

npm run test                  # vitest run (co-located *.test.ts/*.test.tsx files)
npm run test:watch            # vitest, watch mode

npm run template              # regenerate reference translation templates in languages/ from src/**/translations/en.json
npm run buildlangpack -- <file>   # compress/package a single language file from languages/
npm run check -- reference=<path> target=<path>  # validate a language pack against the reference template
```

Tests are written with Vitest, co-located next to the source file they cover (`Foo.ts` → `Foo.test.ts`, no separate `__tests__` folder). Default test environment is `node`; add a `// @vitest-environment jsdom` pragma at the top of a test file when it touches the DOM (e.g. `window`, `document`, hook rendering via `@testing-library/preact`). CI (`.github/workflows/build-ci.yml`) only runs `npm install` and `npm run build` on push/PR — treat a clean `build`, `type-check`, and `test` as the bar for "does this work".

When developing, run `npm run dev` and open `http://localhost:8088`. The dev server (`config/server.js`) emulates the ESP32 HTTP endpoints and the two WebSocket channels (terminal/data) so the UI can run without real hardware; its mock filesystem lives under `server/CNC/FluidNC/{Flash,SD}`.

## Architecture

### Stack
Preact (not React) + TypeScript, Webpack 5, Sass/SCSS, spectre.css base styles with a custom neumorphic/industrial theme. `tsconfig.json` uses `jsxImportSource: preact`, strict mode is on. Prettier: no semicolons, 4-space indent, double quotes, 120 print width — see `.prettierrc`.

### Bootstrap and provider stack
Entry point is `src/index.js` → renders `<App />` (`src/components/App/index.tsx`). The app is a deep stack of context providers, outer to inner: `DatasContextProvider` → `TargetContextProvider` → `RouterContextProvider` → `UiContextProvider` → `HttpQueueContextProvider` → `SettingsContextProvider` → `ToastsContextProvider` → `ModalsContextProvider`. All contexts live in `src/contexts/` and are re-exported from `src/contexts/index.ts`. `App` also gates a `SafetyDisclaimerModal` behind a versioned localStorage flag (`deepmove_disclaimer_version`).

Below the providers, `ContentContainer` (`src/areas/index.tsx`) wires up the extension postMessage bridge (see below) and renders `ViewContainer` (`src/areas/ViewContainer.tsx`), which renders either the `ConnectionContainer` (pre-connection) or `Menu` + `MainContainer` once connected (`connection.connectionState.connected`).

### Target/subtarget system
`src/targets/index.ts` imports `defaultPreferences` directly from the single `src/targets/CNC/FluidNC/preferences.json` file, and re-exports machine settings, panel list, icons, logos, and the `TargetContextProvider`/`useTargetContext` from `./CNC/FluidNC`. All CNC/FluidNC-specific UI, controls, styles and translations live under `src/targets/CNC/FluidNC/`. (Earlier versions merged three layered `preferences.json` files at runtime via a `mergeJSON` helper; that merge was collapsed into one file once the project settled on being permanently mono-target — if multi-target/firmware support is ever reintroduced, this is the seam to extend, and a merge layer can be reintroduced then.)

### Communication with the controller
Two parallel channels talk to the ESP32 controller, mirrored by the mock dev server:
- **HTTP** — `src/adapters/httpAdapter.tsx`, requests are queued through `HttpQueueContext` (`src/contexts/HttpQueueContext.tsx`) rather than fired directly.
- **WebSocket** — `src/Services/WebSocketService.ts` orchestrates a set of focused collaborators rather than doing everything itself: `ReconnectionManager.ts` (backoff/retries), `PingKeepAlive.ts` (ping/keep-alive, session-timeout detection), `SessionManager.ts` (`CURRENTID`/`ACTIVEID`), `CommandQueue.ts` (command queueing/sequencing, built on `Command`/`CommandState` in `src/Services/Commands/`), and `LineBuffer.ts` (pure line-splitting on top of `WebSocketAdapter.ts`'s raw stream). System message parsing (`NOTIFICATION`, `ERROR`, `PING`) lives in `NotificationHandlers.ts`. Protocol details (subprotocol `webui-v3`, message formats) are documented in `Memo/websocket.md`. `useWebSocketService` (`src/hooks/`) is the Preact-facing wrapper.

Realtime G-code commands and the `[ESPnnn]` command family are documented in `Memo/Commands.md`, `Memo/realtimecmd.md`, and the `Memo/ESP3D [ESPxxx] format.md` files — consult these before changing command formatting/parsing.

### Extension (iframe) API
`ContentContainer` (`src/areas/index.tsx`) calls `useExtensionBridge` (`src/areas/extensionBridge.ts`), which registers a `window.addEventListener("message", ...)` listener implementing a `postMessage`-based protocol for third-party iframe extensions (see `extensions/click2go`, `extensions/gcodeViewer` for real examples, `extensions_samples/` for templates). Message types: `cmd`, `query`, `upload`, `download`, `toast`, `modal`, `sound`, `translate`, `icon`, `extensionsData`, `capabilities`, `dispatch` — all handled in `extensionBridge.ts` except `modal` (dynamic field-form rendering + export/import of preferences), which is large enough to live in its own `src/areas/modalFieldsBridge.tsx`. Responses go back out via `dispatchToExtensions` (`src/components/Helpers`). Extensions are packaged/built independently (each has its own `package.json`/`webpack.config.js`) and are loaded into the main UI at runtime, not bundled by the main webpack build.

### UI composition
- `src/areas/` — top-level layout regions: `ViewContainer.tsx` (post-connection switch), `extensionBridge.ts`/`modalFieldsBridge.tsx` (extension IPC, see above), `menu.tsx` (nav), `connection.tsx` (pre-connect screen), `main.tsx` (main content switcher), `footer.tsx`, `elementsCache.tsx`.
- `src/components/Panels/` — the operational panels (Jog, Files, Terminal, Macros, Probe, Spindle/laser overrides, Status, Toolpath viewer, HMI mode, etc.) shown/hidden based on `UiContext` panel state and device size (phone/tablet/desktop — see README's "Filosofía" section: the UI deliberately shows only what's relevant to the current context rather than everything at once). Larger panels split their internal logic into a same-named sibling folder of hooks: `JogCNC.tsx` → `Panels/Jog/` (`useContinuousJog`, `useJogKeyboardShortcuts`, `useLaserFocus`), `Toolpath.tsx` → `Panels/Toolpath/` (`cameraMath.ts` + `useToolpathCamera`, `useCanvasRenderer`, `useToolpathViewPrefs`, `useToolPositionTracking`, `useToolpathFileEvents`, `decidePlayAction`) — not to be confused with `src/components/Toolpath/` below, the native rendering engine those hooks call into.
- `src/components/Controls/` — generic form/field primitives (`Field`, `FieldGroup`, etc.) used both by app UI and dynamically by the extension `modal`/`fields` protocol. `Field.tsx` is a discriminated union over each `Fields/*.tsx` component's own exported props type; most `Fields/*.tsx` components share their dependency-visibility and value-change-notification logic via `Fields/useFieldVisibility.ts` and `Fields/useNotifyValueChange.ts`.
- `src/tabs/` — settings tabs (machine, wifi, interface, features, about) with import/export helpers for preferences. The settings-tree node shape those tabs, `exportHelper.ts` and `Controls/Fields/ItemsList.tsx` all walk is the shared `PreferencesFieldData`/`PreferencesSection` type in `src/types/preferences.types.ts`.
- `src/components/Toolpath/` — the native G-code toolpath viewer/renderer engine itself, self-contained: `core/` (parser, modal state/interpreter, bounding box, toolpath model), `render/` (canvas renderer, projections, view presets, colors), `types/`. Public surface re-exported from `src/components/Toolpath/index.ts`. `GCodeParser.ts` (currently untracked/WIP) belongs here. (Not to be confused with `src/components/Panels/Toolpath/`, the `Toolpath.tsx` panel's own hooks — see above.)
- `src/hooks/` — cross-cutting hooks: `useHttpQueue`, `useSettings`, `useTargetCommands`, `useFilesManager`, `useWebSocketService`, `eventBus`.
- `src/contexts/Ui/` — `UiContext.tsx`'s internal collaborators (`audioEngine.ts`, `haptics.ts`, `usePanelsVisibility.ts`, `settingsTree.ts` for the `getValue`/`getElement` tree walk); the public surface stays `UiContextProvider`/`useUiContext`/`useUiContextFn` from `UiContext.tsx` itself.

### Translations
Translation JSON lives alongside the code it belongs to (`src/targets/translations/`, `src/targets/CNC/translations/`, `src/targets/CNC/FluidNC/translations/`), keyed by locale (`en.json`, etc.), and are combined with a plain object spread in `src/components/Translations/index.ts` (subtarget keys win over target, which win over base) — a different, simpler mechanism than the target/subtarget preferences system above, and one that was never `mergeJSON`-based even before that preferences merge was collapsed. `T()` (`src/components/Translations`) resolves keys at render time; `baseLangRessource` exposes the flattened resource for the extension `translate` message type. `npm run template` regenerates the canonical reference file in `languages/` from these `en.json` sources — run it after adding/renaming translation keys.

## Notes
- **Known issue, not yet fixed**: `JogCNC.tsx`'s `currentFeedRate`/`currentAxis` are module-level singletons, so every mounted `<JogPanel>` shares the same state — and `JogPanel` is already rendered twice in practice (the standalone `jog` dashboard panel, and embedded via `<JogPanel embedded />` in `Hmi.tsx`). Fixing this needs the double-instance scenario reproduced on real hardware/a simulator first, to confirm it's actually a bug (vs. an intentional "one jog state app-wide" design) before choosing between per-instance state and a shared context. See the comment at the top of `JogCNC.tsx`.
- The bundle analyzer report/stats files at the repo root (`bundle-report-CNC-FluidNC.html`, `bundle-stats-CNC-FluidNC.json`) and everything in `dist/` are build output, not source — don't hand-edit them, they regenerate via `npm run build` / `analyze-bundle.js`.
- `Memo/` contains protocol and design notes (ESP command formats, websocket protocol, preferences/variables lists, feature notes) written by the maintainers — treat it as living reference documentation for the ESP3D/FluidNC protocol, not as a spec that's necessarily 100% in sync with code.
- `any` is repo-wide `warn` in `.eslintrc.json`, but ratcheted up to `error` for `src/contexts/**`, `src/components/Controls/**`, `src/targets/**`, `src/components/Panels/Jog/**`, and a handful of `src/Services/*.ts` collaborators (see the `overrides` block) — with a second `overrides` entry reverting specific still-not-fully-typed files back to `warn` (dynamic settings trees, extension-message payloads, `Field.tsx`'s discriminated-union escape hatches, the ambient module declarations, ...). Test files (`*.test.ts(x)`) are excluded from the strict tier entirely. When a file in that exceptions list gets fully typed, remove it from the list (don't just leave it); when cleaning up a new folder, extend the strict `files` list rather than loosening existing entries. `src/components/Controls/**` and `src/targets/**` are NOT fully clean as whole trees — most of the remaining `any` in the repo lives in exactly the files still listed in the exceptions override.
