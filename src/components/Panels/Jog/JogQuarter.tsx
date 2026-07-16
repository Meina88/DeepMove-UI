/*
 JogQuarter.tsx - ESP3D WebUI component file

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

const JogQuarter = ({ rotate = 0 }: { rotate?: number }) => {
    const cx = 75
    const cy = 41 // 82 / 2

    return (
        <svg
            viewBox="0 0 150 82"
            width="120"
            height="120"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block" }}
        >
            <g transform={`rotate(${rotate} ${cx} ${cy})`}>

                {/* 🔵 Fondo detrás de la flecha (controlable por CSS) */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={18}
                    class="jog-arrow-bg"
                />

                <path
                    d="M74.5957 0C100.399 -9.84196e-07 125.326 8.48829 145.646 23.917C150.191 27.3678 150.324 33.9932 146.289 38.0283L115.955 68.3623C112.323 71.9948 106.569 72.1903 102.115 69.6299C93.814 64.857 84.3379 62.2803 74.5957 62.2803C64.8535 62.2803 55.3782 64.857 47.0771 69.6299C42.6236 72.1905 36.8698 71.9948 33.2373 68.3623L2.90229 38.0283C-1.13276 33.9932 -0.999008 27.3678 3.54585 23.917C23.8661 8.48846 48.7929 7.61396e-05 74.5957 0ZM62.9013 37.0322V39.2148L65.0292 40.8506L73.8105 32.124V26.124L62.9013 37.0322ZM74.9013 32.124L83.6835 40.8506L85.8105 39.2148V37.0322L74.9013 26.124V32.124Z"
                    fill="#E5E5E5"
                />

            </g>
        </svg>
    )
}

export { JogQuarter }
