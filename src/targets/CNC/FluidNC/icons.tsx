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
        <path d="M360-520h80v-160h-80v160Zm120 0h80v-160h-80v160Zm120 0h80v-160h-80v160ZM240-80q-33 0-56.5-23.5T160-160v-480l240-240h320q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640H434L240-606v446Zm0 0h480-480Z" />
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
        xmlns="http://www.w3.org/2000/svg"
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
    >
        <path d="M300-360h60v-160h-60v50h-60v60h60v50Zm100-50h320v-60H400v60Zm200-110h60v-50h60v-60h-60v-50h-60v160Zm-360-50h320v-60H240v60Zm80 450v-80H160q-33 0-56.5-23.5T80-280v-480q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v480q0 33-23.5 56.5T800-200H640v80H320ZM160-280h640v-480H160v480Zm0 0v-480 480Z" />
    </svg>
)


const Outputs: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M720-360v-80h80q17 0 28.5 11.5T840-400q0 17-11.5 28.5T800-360h-80Zm0 160v-80h80q17 0 28.5 11.5T840-240q0 17-11.5 28.5T800-200h-80Zm-160 40q-33 0-56.5-23.5T480-240h-80v-160h80q0-33 23.5-56.5T560-480h120v320H560ZM280-280q-66 0-113-47t-47-113q0-66 47-113t113-47h60q25 0 42.5-17.5T400-660q0-25-17.5-42.5T340-720H200q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h140q58 0 99 41t41 99q0 58-41 99t-99 41h-60q-33 0-56.5 23.5T200-440q0 33 23.5 56.5T280-360h80v80h-80Z" />
    </svg>
)

const Joystick: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M189-160q-60 0-102.5-43T42-307q0-9 1-18t3-18l84-336q14-54 57-87.5t98-33.5h390q55 0 98 33.5t57 87.5l84 336q2 9 3.5 18.5T919-306q0 61-43.5 103.5T771-160q-42 0-78-22t-54-60l-28-58q-5-10-15-15t-21-5H385q-11 0-21 5t-15 15l-28 58q-18 38-54 60t-78 22Zm3-80q19 0 34.5-10t23.5-27l28-57q15-31 44-48.5t63-17.5h190q34 0 63 18t45 48l28 57q8 17 23.5 27t34.5 10q28 0 48-18.5t21-46.5q0 1-2-19l-84-335q-7-27-28-44t-49-17H285q-28 0-49.5 17T208-659l-84 335q-2 6-2 18 0 28 20.5 47t49.5 19Zm348-280q17 0 28.5-11.5T580-560q0-17-11.5-28.5T540-600q-17 0-28.5 11.5T500-560q0 17 11.5 28.5T540-520Zm80-80q17 0 28.5-11.5T660-640q0-17-11.5-28.5T620-680q-17 0-28.5 11.5T580-640q0 17 11.5 28.5T620-600Zm0 160q17 0 28.5-11.5T660-480q0-17-11.5-28.5T620-520q-17 0-28.5 11.5T580-480q0 17 11.5 28.5T620-440Zm80-80q17 0 28.5-11.5T740-560q0-17-11.5-28.5T700-600q-17 0-28.5 11.5T660-560q0 17 11.5 28.5T700-520Zm-360 60q13 0 21.5-8.5T370-490v-40h40q13 0 21.5-8.5T440-560q0-13-8.5-21.5T410-590h-40v-40q0-13-8.5-21.5T340-660q-13 0-21.5 8.5T310-630v40h-40q-13 0-21.5 8.5T240-560q0 13 8.5 21.5T270-530h40v40q0 13 8.5 21.5T340-460Z" />
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

const Cyclone: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
    >
        <path d="M480-320q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400ZM661-80q18-56 27-100t14-70q-43 42-100 66t-122 24q-136 0-238.5-18.5T80-214v-85q56 18 100 27t70 14q-42-43-66-100t-24-122q0-137 18.5-239T214-880h85q-18 56-27.5 100T258-710q43-42 100-66t122-24q137 0 239 18.5T880-746v85q-56-18-100-27.5T710-702q42 43 66 100t24 122q0 137-18.5 239T746-80h-85Zm-11-230q70-70 70-170t-70-170q-70-70-170-70t-170 70q-70 70-70 170t70 170q70 70 170 70t170-70Z" />
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

const DashGear: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M440-520v-280h440v280H440ZM80-160v-280h400v280H80Zm0-360v-280h280v280H80Zm440-80h280v-120H520v120ZM160-240h240v-120H160v120Zm0-360h120v-120H160v120Zm360 0ZM400-360ZM280-600ZM680-80l-12-60q-12-5-22.5-10.5T624-164l-58 18-40-68 46-40q-2-13-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T668-420l12-60h80l12 60q12 5 22.5 10.5T816-396l58-18 40 68-46 40q2 13 2 26t-2 26l46 40-40 68-58-18q-11 8-21.5 13.5T772-140l-12 60h-80Zm96.5-143.5Q800-247 800-280t-23.5-56.5Q753-360 720-360t-56.5 23.5Q640-313 640-280t23.5 56.5Q687-200 720-200t56.5-23.5Z" />
    </svg>
)



const FluidIcon: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 0 3018 1122"
        fill="currentColor"
        class="esp3dlogo"
    >
        <g id="Layer_x0020_1">


            <path

                d="M1748 122c-6,201 20,269 125,419 54,71 83,158 83,247 0,94 -32,185 -90,258 7,-215 -32,-257 -121,-405 -89,-121 -173,-371 3,-519z"
            />
            <path

                d="M1706 1122c15,-129 -80,-211 -125,-309 -10,-23 -15,-47 -15,-72 0,-53 24,-103 65,-136 14,122 104,217 144,331 21,59 15,121 -69,186z"
            />
            <path

                d="M1953 520c21,-128 -69,-217 -109,-315 -8,-20 -12,-42 -12,-63 0,-56 27,-109 72,-142 7,122 92,224 125,339 18,58 11,119 -76,181z"
            />
        </g>
    </svg>
)

const GearIcon: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
    >
        <path d="M440-280h80l12-60q12-5 22.5-10.5T576-364l58 18 40-68-46-40q2-14 2-26t-2-26l46-40-40-68-58 18q-11-8-21.5-13.5T532-620l-12-60h-80l-12 60q-12 5-22.5 10.5T384-596l-58-18-40 68 46 40q-2 14-2 26t2 26l-46 40 40 68 58-18q11 8 21.5 13.5T428-340l12 60Zm-16.5-143.5Q400-447 400-480t23.5-56.5Q447-560 480-560t56.5 23.5Q560-513 560-480t-23.5 56.5Q513-400 480-400t-56.5-23.5ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
    </svg>
)

const DashboardIcon: FunctionalComponent<IconProps> = ({ height = "1.5em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g transform="translate(0 0)">
            <path d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Zm80-400h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Z" />
        </g>
    </svg>
)

const DeepMoveIcon: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 0 2000 2000"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g>
            <path d="M1369.81 167.07c-0.39,228.91 -1.05,442.74 6.35,672.83 6.84,213.01 -117.91,360.13 -287.47,407.96 -95.57,26.96 -196.16,16.32 -278.01,-23.11 -63.19,-30.44 -148.4,-100.97 -176.07,-157.74l0.5 605.35c104.05,64.78 327.54,82.33 464.87,65.91 402.29,-48.12 761.35,-406.68 760.43,-874.15 -0.38,-188.34 -65.39,-353.21 -151.26,-477.27 -71.91,-103.91 -222.03,-256.71 -339.99,-294.1l0.65 74.32z" />
            <path d="M564.1 1878.12c6.26,-63.65 1.49,-429.57 1.49,-525.5 -0.02,-164.93 -22.85,-342.34 50.84,-470.08 102.73,-178.1 339.32,-261.52 537.56,-161.24 86.98,44 99.35,76.9 138.14,112.32 0.86,0.79 3.4,4.28 4.05,3.14 0.65,-1.17 2.72,2.18 4.03,3.07l-2.1 -535.8c-56.18,-45.37 -272.87,-67.55 -363.25,-61.92 -128.71,8.01 -232.49,38.94 -333.38,86.17 -403.25,188.78 -603.32,659.94 -431.55,1110.54 63.08,165.51 237.69,372.21 394.17,439.3z" />
        </g>
    </svg>
)

const Frame: FunctionalComponent<IconProps> = ({ height = "1.2em" }) => (
    <svg
        height={height}
        viewBox="0 -960 960 960"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm400 0v-80h160v-160h80v160q0 33-23.5 56.5T760-120H600ZM120-600v-160q0-33 23.5-56.5T200-840h160v80H200v160h-80Zm640 0v-160H600v-80h160q33 0 56.5 23.5T840-760v160h-80Z" />
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
    ClearPath: <ClearPath />,
    DashGear: <DashGear />,
    FluidIcon: <FluidIcon />,
    GearIcon: <GearIcon />,
    DashboardIcon: <DashboardIcon />,
    DeepMoveIcon: <DeepMoveIcon />,
    Cyclone: <Cyclone />,
    Frame: <Frame />

} as const

export { Fan, FeedRate, FlowRate, SDCard, Mixer, Outputs, Joystick, Status, Diamond, Flare, iconsTarget, ClearPath, DashGear, FluidIcon, GearIcon, DashboardIcon, DeepMoveIcon, Cyclone, Frame }

