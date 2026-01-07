/*
SpindleCNC.js - ESP3D WebUI component file

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.
 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.
 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

import { Fragment, TargetedMouseEvent } from "preact"
import type { FunctionalComponent } from "preact"
import { T } from "../Translations"
import { Repeat, Play, Pause } from "preact-feather"
import { useUiContextFn } from "../../contexts"
import { useTargetContext } from "../../targets"
import {
    ButtonImg,
    FullScreenButton,
    CloseButton,
    ContainerHelper,
} from "../Controls"
import { useTargetCommands } from "../../hooks"

type OverrideId = "spindle" | "feed"
type Overrides = Partial<Record<OverrideId, number>> &
    Record<string, number | undefined>

type StateValue = { value: string } | Array<{ value: string }>
type StatesMap = Record<string, StateValue>    

const OverridesControls: FunctionalComponent = () => {
  const { states } = useTargetContext() as { states: StatesMap }

  if (!useUiContextFn.getValue("showoverridespanel")) return null

  // Mismo enfoque que SpindleControls:
  const statesArray = [
    { id: "spindle_speed", label: "CN64" }, // Speed
    { id: "feed_rate", label: "CN9" },      // Feedrate
  ] as const

  return (
    <Fragment>
      {states && (states.spindle_speed || states.feed_rate) && (
        <div class="status-ctrls">
          {statesArray.map((element) => {
            const sv = states[element.id]
            if (!sv) return null

            const displayVal = Array.isArray(sv)
              ? sv.map((i) => i.value).join(" ")
              : sv.value

            return (
              <div
                key={element.id}
                class="extra-control mt-1 tooltip tooltip-bottom"
                data-tooltip={T(element.label)}
              >
                <div class="extra-control-header">{T(element.label)}</div>
                <div class="extra-control-value">{displayVal}</div>
              </div>
            )
          })}
        </div>
      )}
    </Fragment>
  )
}


const OverridesPanel: FunctionalComponent = () => {
    const { targetCommands } = useTargetCommands()
    const { status } = useTargetContext() as any
    const id = "OverridesPanel"

    const spindleButtons = [
        { label: "+10%", tooltip: "CN67", command: "#SSO+10#" },
        { label: "100%", tooltip: "CN66", command: "#SSO100#" },
        { label: "-10%", tooltip: "CN67", command: "#SSO-10#" },

    ]

    const feedButtons = [
        { label: "+10%", tooltip: "CN68", command: "#FO+10#" },
        { label: "100%", tooltip: "CN66", command: "#FO100#" },
        { label: "-10%", tooltip: "CN68", command: "#FO-10#" },

    ]

    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} />

            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Repeat />
                    <strong class="text-ellipsis">{T("CN65")}</strong>
                </span>
                <span class="navbar-section">
                    <span class="full-height">
                        <FullScreenButton elementId={id} />
                        <CloseButton
                            elementId={id}
                            hideOnFullScreen={true}
                        />
                    </span>
                </span>
            </div>

            <div class="panel-body panel-body-dashboard">
                <OverridesControls />

                <div class="overrides-top-placeholder" />

                {/* Spindle buttons */}
                <div class="field-group-content maxwidth spindle">
                    <div class="states-buttons-container">
                        {spindleButtons.map((button) => (
                            <ButtonImg
                                key={button.label}
                                mt1
                                label={T(button.label)}
                                data-tooltip={T(button.tooltip)}
                                onClick={(
                                    e: TargetedMouseEvent<HTMLButtonElement>
                                ) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()
                                    targetCommands(button.command)
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* HOLD / START central */}
                <div class="override-buttons-container">
                    {[
                        {
                            cmd: "#FEEDHOLD#",
                            icon: <Pause />,
                            desc: T("Hold"),
                            depend: [
                                "Door",
                                "Sleep",
                                "Alarm",
                                "Error",
                                "Check",
                                "Run",
                                "Idle",
                                "Home",
                                "Jog",
                                "Tool",
                                "?",
                            ],
                        },
                        {
                            cmd: "#CYCLESTART#",
                            icon: <Play />,
                            desc: T("CN61"),
                            depend: ["Hold", "Tool"],
                        },
                    ].map((button) => {
                        if (
                            button.depend &&
                            !button.depend.includes(status?.state || "")
                        ) {
                            return null
                        }

                        return (
                            <ButtonImg
                                key={button.cmd}
                                icon={button.icon}
                                tooltip
                                data-tooltip={button.desc}
                                onClick={() =>
                                    targetCommands(button.cmd)
                                }
                            />
                        )
                    })}
                </div>

                {/* Feed buttons */}
                <div class="field-group-content maxwidth feed">
                    <div class="states-buttons-container">
                        {feedButtons.map((button) => (
                            <ButtonImg
                                key={button.label}
                                mt1
                                label={T(button.label)}
                                data-tooltip={T(button.tooltip)}
                                onClick={(
                                    e: TargetedMouseEvent<HTMLButtonElement>
                                ) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()
                                    targetCommands(button.command)
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const OverridesPanelElement = {
    id: "OverridesPanel",
    content: <OverridesPanel />,
    name: "CN65",
    icon: "Repeat",
    show: "showoverridespanel",
    onstart: "openoverridesonstart",
    settingid: "overrides",
}

export { OverridesPanel, OverridesPanelElement, OverridesControls }
