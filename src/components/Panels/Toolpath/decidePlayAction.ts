/*
 decidePlayAction.ts - pure decision logic for the toolpath viewer's
 Play/Pause button: whether it should show pause (a job is running), resume
 (held or paused at a safety-door with substate 0), or run-the-selected-file
 (idle with a file selected).
*/

export type PlayAction = "pause" | "resume" | "run-file" | "none"

export interface MachineRunState {
    state?: string
    substate?: number
}

export interface PlayActionResult {
    action: PlayAction
    canPause: boolean
    canResume: boolean
    canRunFile: boolean
    canPlay: boolean
    // Exposed separately from canResume for the Play button's "is-active" glow,
    // which the original only lit for an actual Hold (not for the broader
    // canResume, which also covers a Door stop at substate 0).
    isHold: boolean
}

export function decidePlayAction(status: MachineRunState | undefined, hasSelectedFile: boolean): PlayActionResult {
    const canResumeFromDoor = status?.state === "Door" && status?.substate === 0
    const isRun = status?.state === "Run"
    const isHold = status?.state === "Hold"
    const isIdle = status?.state === "Idle"

    const canPause = isRun
    const canResume = isHold || canResumeFromDoor
    const canRunFile = isIdle && hasSelectedFile
    const canPlay = canResume || canRunFile

    let action: PlayAction = "none"
    if (canPause) action = "pause"
    else if (canResume) action = "resume"
    else if (canRunFile) action = "run-file"

    return { action, canPause, canResume, canRunFile, canPlay, isHold }
}
