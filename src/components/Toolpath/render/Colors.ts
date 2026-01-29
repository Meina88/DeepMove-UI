// Colors.ts
// Toolpath color resolver from CSS variables (runtime-safe)

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()

  return value || fallback
}

export function getToolpathColors() {
  return {
    // Background
    background: cssVar("--tp-bg", "#111"),

    // Toolpath segments
    rapid: cssVar("--tp-rapid", "#777"),
    linear: cssVar("--tp-linear", "#4da3ff"),
    arc: cssVar("--tp-arc", "#4ddc8c"),

    // Feed visualization
    feed: cssVar("--tp-feed", "#4da3ff"),
    feedCut: cssVar("--tp-feed-cut", "#ff9f1a"),

    // Completed path
    completed: cssVar("--tp-completed", "#ffcc33"),

    // Tool position
    tool: cssVar("--tp-tool", "#ff4d4d"),

    // Grid
    gridMajor: cssVar("--tp-grid-major", "rgba(255,255,255,0.12)"),
    gridMinor: cssVar("--tp-grid-minor", "rgba(255,255,255,0.05)"),

    // Axis
    axisX: cssVar("--tp-axis-x", "rgba(255,0,0,0.9)"),
    axisY: cssVar("--tp-axis-y", "rgba(0,255,0,0.9)"),
    axisZ: cssVar("--tp-axis-z", "rgba(0,128,255,0.9)"),
  }
}
