/*
 icon.js - ESP3D WebUI images file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

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

import { FunctionalComponent } from "preact"

interface IconProps {
    height?: string
}

/*
 *fan icon
 * default height is 1.2m
 */
const Fan: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg height={height} viewBox="-4 1 38 30">
        <g>
            <path
                fill="currentColor"
                d="M 25,1.73 C 24.9,1.7 24.6,1.54 24.2,1.42 22,0.56 19.6,0.98 18,2.51 c -0.4,0.45 -1.5,2.06 -1.6,2.83 -0.6,1.67 -0.8,3.5 -0.6,5.16 0.1,0.4 0.1,0.5 0,0.5 -0.6,0 -1.5,0.3 -2.2,0.6 -0.2,0 -0.2,0 -0.6,-0.2 C 12.3,10.7 11.8,9.87 11.4,8.58 11.3,8.24 11.1,7.3 11,6.49 10.8,5.53 10.6,4.96 10.5,4.64 9.97,3.43 8.48,2.57 7.13,2.6 5.48,2.66 3.47,4.15 2.24,6.19 1.86,6.84 1.38,7.97 1.23,8.54 0.96,9.67 1.01,11.1 1.36,12.1 c 0.22,0.6 0.76,1.5 1.21,2 0.46,0.4 2.18,1.4 2.88,1.6 1.74,0.6 3.49,0.8 5.05,0.6 0.3,-0.1 0.5,-0.1 0.5,-0.1 0,0.7 0.2,1.6 0.5,2.1 0.1,0.2 0.1,0.3 0,0.5 -0.2,0.3 -0.7,0.8 -1,1.1 -0.93,0.6 -1.82,0.9 -3.95,1.2 -0.96,0.2 -1.52,0.4 -1.81,0.5 -0.83,0.4 -1.53,1.2 -1.85,2 -0.43,1.4 -0.22,2.4 0.71,3.8 1.3,1.9 3.78,3.4 5.97,3.6 1.63,0.2 3.13,-0.3 4.33,-1.4 0.4,-0.3 0.5,-0.5 1,-1.4 0.5,-0.7 0.6,-1.1 0.8,-1.5 0.6,-1.7 0.8,-3.5 0.5,-5.1 0,-0.3 0,-0.5 0,-0.5 0,0 0.3,-0.1 0.6,-0.1 0.6,-0.1 1.1,-0.2 1.5,-0.5 0.3,-0.1 0.4,0 0.9,0.4 1,0.9 1.4,2 1.9,4.7 0.2,0.9 0.3,1.5 0.5,1.8 0.5,1.2 2,2.1 3.3,2 1.7,0 3.8,-1.5 5,-3.5 1.1,-2 1.5,-4.1 0.8,-5.9 -0.2,-0.5 -0.7,-1.5 -1.1,-1.9 -0.5,-0.4 -1.9,-1.3 -2.6,-1.6 -1.7,-0.7 -3.8,-0.9 -5.5,-0.7 -0.2,0.1 -0.4,0.1 -0.4,0.1 -0.1,-0.6 -0.3,-1.6 -0.5,-2.1 -0.2,-0.3 -0.2,-0.4 0.3,-1 0.9,-0.9 2,-1.3 4.6,-1.8 1,-0.2 1.6,-0.4 1.8,-0.5 C 28.6,9.87 29.5,8.41 29.4,7.04 29.3,5.37 27.8,3.34 25.8,2.12 25.4,1.95 25.1,1.78 25,1.73 c 0,0 0,0 0,0 M 18.9,13.2 c 0.5,0.6 0.8,1.1 1,1.9 0.2,0.7 0.2,1.4 0,2.1 -0.7,2.5 -3.7,3.7 -6,2.4 -1.8,-1.2 -2.5,-3.7 -1.4,-5.6 0.6,-1 1.4,-1.6 2.6,-1.8 1.4,-0.4 2.8,0 3.8,1 0,0 0,0 0,0"
            />
            <path
                fill="currentColor"
                d="M 17.2,13.2 C 16.6,13 15.6,13 15,13.1 c -2.2,0.5 -2.9,4 -1.2,5.4 1.5,1.3 4.4,0.7 5.1,-1.1 0.4,-1.7 0.1,-2.9 -0.8,-3.7 -0.2,-0.2 -0.4,-0.3 -0.5,-0.3 0,0 -0.2,-0.2 -0.4,-0.2 0,0 0,0 0,0"
            />
        </g>
    </svg>
)

const SDCard: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
  <svg
    height={height}
    viewBox="0 -960 960 960"
    fill="currentColor"
  >
    <path d="M360-520h80v-160h-80v160Zm120 0h80v-160h-80v160Zm120 0h80v-160h-80v160ZM240-80q-33 0-56.5-23.5T160-160v-480l240-240h320q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640H434L240-606v446Zm0 0h480-480Z"/>
  </svg>
)

/*
 *feedrate icon
 * default height is 1.2m
 */
const FeedRate: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg height={height} viewBox="-10 4 112 90">
        <path
            style="stroke:currentColor;stroke-width:12;fill:none"
            d="M84.78 48.08C84.88 62.28 74.58 75.08 61.48 79.78C46.08 85.78 26.88 81.68 16.38 68.48C7.98 58.58 6.58 43.48 13.18 32.28C20.38 18.98 36.08 11.58 50.98 13.24"
        />
        <path
            style="stroke:currentColor;stroke-width:12;fill:none"
            d="M59.18 14.76C64.38 16.38 69.28 18.88 73.48 22.38"
        />
        <path
            style="stroke:currentColor;stroke-width:12;fill:none"
            d="M79.18 27.48C82.08 31.38 84.08 35.98 84.88 40.78"
        />
        <path
            style="stroke:currentColor;fill:currentColor"
            d="M37.58 45.28C45.28 41.38 52.98 37.58 60.68 33.68C57.68 41.48 54.68 49.38 51.68 57.18C46.98 53.18 42.28 49.28 37.58 45.28C37.58 45.28 37.58 45.28 37.58 45.28"
        />
    </svg>
)

/*
 *flowrate icon
 * default height is 1.2m
 */
const FlowRate: FunctionalComponent<IconProps> = ({ height = "1.0em" }) => (
    <svg height={height} viewBox="1 21 90 59">
        <path
            d="m 47.2,42.3 0.2,-25 m 8.8,35.1 a 9.12,9.13 0 0 1 -9.1,9.1 9.12,9.13 0 0 1 -9.1,-9.1 9.12,9.13 0 0 1 9.1,-9.1 9.12,9.13 0 0 1 9.1,9.1 z m 13.7,0.7 A 22.8,22.8 0 0 1 47.1,75.9 22.8,22.8 0 0 1 24.3,53.1 22.8,22.8 0 0 1 47.1,30.3 22.8,22.8 0 0 1 69.9,53.1 Z M 47.2,29.9 A 22.8,22.8 0 0 0 25.8,44.5 H 4.66 c -0.74,0 -1.35,0.6 -1.35,1.3 v 13 c 0,0.8 0.61,1.6 1.35,1.6 H 25.5 A 22.8,22.8 0 0 0 47.2,75.5 22.8,22.8 0 0 0 68.6,60.4 h 19.1 c 0.8,0 1.3,-0.8 1.3,-1.6 v -13 c 0,-0.7 -0.5,-1.3 -1.3,-1.3 H 68.4 A 22.8,22.8 0 0 0 47.2,29.9 Z"
            style="fill:none;stroke:currentColor;stroke-width:7.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
        />
    </svg>
)

const Mixer: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
    >
        <path d="M200-160v-280h-80v-80h240v80h-80v280h-80Zm0-440v-200h80v200h-80Zm160 0v-80h80v-120h80v120h80v80H360Zm80 440v-360h80v360h-80Zm240 0v-120h-80v-80h240v80h-80v120h-80Zm0-280v-360h80v360h-80Z" />
    </svg>
)

const Outputs: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M720-360v-80h80q17 0 28.5 11.5T840-400q0 17-11.5 28.5T800-360h-80Zm0 160v-80h80q17 0 28.5 11.5T840-240q0 17-11.5 28.5T800-200h-80Zm-160 40q-33 0-56.5-23.5T480-240h-80v-160h80q0-33 23.5-56.5T560-480h120v320H560ZM280-280q-66 0-113-47t-47-113q0-66 47-113t113-47h60q25 0 42.5-17.5T400-660q0-25-17.5-42.5T340-720H200q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h140q58 0 99 41t41 99q0 58-41 99t-99 41h-60q-33 0-56.5 23.5T200-440q0 33 23.5 56.5T280-360h80v80h-80Z"/>
    </svg>
)

const Joystick: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M189-160q-60 0-102.5-43T42-307q0-9 1-18t3-18l84-336q14-54 57-87.5t98-33.5h390q55 0 98 33.5t57 87.5l84 336q2 9 3.5 18.5T919-306q0 61-43.5 103.5T771-160q-42 0-78-22t-54-60l-28-58q-5-10-15-15t-21-5H385q-11 0-21 5t-15 15l-28 58q-18 38-54 60t-78 22Zm3-80q19 0 34.5-10t23.5-27l28-57q15-31 44-48.5t63-17.5h190q34 0 63 18t45 48l28 57q8 17 23.5 27t34.5 10q28 0 48-18.5t21-46.5q0 1-2-19l-84-335q-7-27-28-44t-49-17H285q-28 0-49.5 17T208-659l-84 335q-2 6-2 18 0 28 20.5 47t49.5 19Zm348-280q17 0 28.5-11.5T580-560q0-17-11.5-28.5T540-600q-17 0-28.5 11.5T500-560q0 17 11.5 28.5T540-520Zm80-80q17 0 28.5-11.5T660-640q0-17-11.5-28.5T620-680q-17 0-28.5 11.5T580-640q0 17 11.5 28.5T620-600Zm0 160q17 0 28.5-11.5T660-480q0-17-11.5-28.5T620-520q-17 0-28.5 11.5T580-480q0 17 11.5 28.5T620-440Zm80-80q17 0 28.5-11.5T740-560q0-17-11.5-28.5T700-600q-17 0-28.5 11.5T660-560q0 17 11.5 28.5T700-520Zm-360 60q13 0 21.5-8.5T370-490v-40h40q13 0 21.5-8.5T440-560q0-13-8.5-21.5T410-590h-40v-40q0-13-8.5-21.5T340-660q-13 0-21.5 8.5T310-630v40h-40q-13 0-21.5 8.5T240-560q0 13 8.5 21.5T270-530h40v40q0 13 8.5 21.5T340-460Z"/>
    </svg>
)

const Status: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
    >
        <path d="M160-200h640v-80H160v80Zm160-240h80v-120q0-33 23.5-56.5T480-640v-80q-66 0-113 47t-47 113v120Zm-200-80h400v-200q0-83-58.5-141.5T480-760q-83 0-141.5 58.5T280-560v200ZM160-120q-33 0-56.5-23.5T80-200v-80q0-33 23.5-56.5T160-360h40v-200q0-117 81.5-198.5T480-840q117 0 198.5 81.5T760-560v200h40q33 0 56.5 23.5T880-280v80q0 33-23.5 56.5T800-120H160Zm320-240Z" />
    </svg>
)

const Diamond: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
    >
        <path d="M480-120 80-600l120-240h560l120 240-400 480Zm-95-520h190l-60-120h-70l-60 120Zm55 347v-267H218l222 267Zm80 0 222-267H520v267Zm144-347h106l-60-120H604l60 120Zm-474 0h106l60-120H250l-60 120Z" />
    </svg>
)

const Flare: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
    >
        <path d="M40-440v-80h240v80H40Zm270-154-84-84 56-56 84 84-56 56Zm130-86v-240h80v240h-80Zm210 86-56-56 84-84 56 56-84 84Zm30 154v-80h240v80H680Zm-200 80q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm198 134-84-84 56-56 84 84-56 56Zm-396 0-56-56 84-84 56 56-84 84ZM440-40v-240h80v240h-80Z" />
    </svg>
)

/*
 *clear path (broom) icon
 * default height is 1.2em
 */
const ClearPath: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
  <svg
    height={height}
    viewBox="0 0 7000 7000"
    xmlns="http://www.w3.org/2000/svg"
  >    {/* Escoba – parte 1 */}
    <path
      fill="currentColor"
      d="M5389 6905 c-26 -8 -63 -31 -84 -52 -49 -49 -860 -1446 -852 -1467 3 -6 45 -34 93 -62 49 -28 134 -77 189 -109 55 -32 157 -91 227 -131 l127 -72 149 257 c291 502 650 1127 672 1171 35 67 33 149 -6 219 -32 60 -68 87 -261 195 -115 65 -174 77 -254 51z"
    />

    {/* Escoba – parte 2 */}
    <path
      fill="currentColor"
      d="M3483 5604 c-23 -9 -59 -32 -80 -53 -52 -52 -222 -351 -235 -415 -16 -75 9 -154 65 -208 60 -59 2011 -1183 2077 -1197 87 -19 194 25 243 99 13 19 64 105 113 190 l89 155 0 75 c0 96 -31 154 -108 204 -45 30 -814 475 -1713 991 -324 186 -348 195 -451 159z"
    />

    {/* Escoba – parte 3 */}
    <path
      fill="currentColor"
      d="M2927 4760 c-159 -256 -356 -500 -592 -735 -200 -201 -382 -352 -765 -640 -166 -124 -300 -230 -298 -235 2 -4 49 -59 104 -122 141 -157 394 -402 548 -531 l130 -108 80 79 c45 43 249 242 454 441 204 200 372 361 372 358 0 -3 -136 -251 -301 -551 -166 -301 -300 -548 -298 -550 20 -19 272 -176 397 -247 509 -293 1123 -537 1838 -733 72 -20 135 -36 140 -36 5 0 9 118 10 273 0 206 4 301 18 392 69 473 212 903 483 1453 58 118 101 217 97 222 -9 8 -62 39 -1129 655 -341 197 -751 434 -912 526 -160 93 -298 171 -305 174 -10 4 -33 -24 -71 -85z"
    />
  </svg>
)

const iconsTarget = {
    Fan: <Fan />,
    FeedRate: <FeedRate />,
    FlowRate: <FlowRate />,
    SDCard: <SDCard />,
    Mixer: <Mixer />,
    Outputs: <Outputs />,
    Joystick: <Joystick />,
    Status: <Status />,
    Diamond: <Diamond />,
    Flare: <Flare />,
    ClearPath: <ClearPath />
} as const

export { Fan, FeedRate, FlowRate, SDCard, Mixer, Outputs, Joystick, Status, Diamond, Flare, iconsTarget, ClearPath }

