/*
 * The dashboard computes which panels start visible exactly once (`initDone`
 * latches). That must not happen before the interface settings exist, or the
 * panels' `show`/`onstart` flags all read as undefined, nothing is made
 * visible, and the result is never revisited when the real settings arrive.
 */
export function shouldInitPanels(initDone: boolean, panelCount: number, settingsLoaded: boolean): boolean {
    return !initDone && panelCount !== 0 && settingsLoaded
}
