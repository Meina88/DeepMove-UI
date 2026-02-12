/*
 logo.js - FluidNC logo file
 from https://raw.githubusercontent.com/wiki/bdring/FluidNC/images/logos/FluidNC.svg

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
import { useSettingsContext } from "../../../contexts/SettingsContext"

interface LogoProps {
  height?: string
  color?: string
  bgcolor?: string
}

/*
 *DeepMove Logo default height is px
 */
const AppLogo: FunctionalComponent<LogoProps> = ({
  height = "30px",
  color = "var(--logo-color)",
  bgcolor = "transparent",
}) => {
  const { interfaceSettings } = useSettingsContext() as any
  if (
    interfaceSettings.current &&
    interfaceSettings.custom &&
    interfaceSettings.custom.logo
  )
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: interfaceSettings.custom.logo
            .replace("{height}", height)
            .replaceAll("{color}", color)
            .replaceAll("{bgcolor}", bgcolor),
        }}
      ></span>
    )
  else
    return (
      <svg
        height={height}
        viewBox="0 0 10000 2000"
        fill="none"
        class="esp3dlogo"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        <g fill={color}>
          <path d="M4899.72 1468.3l254.93 2.06c57.97,-156.27 139.82,-742.5 184.26,-812.78l169.65 773.68c21.5,53.55 24.01,37.85 190.19,37.14 25.71,-68.48 393.87,-610.4 492.01,-751.48 31.1,-44.7 13.12,-27.87 50.19,-49.49l-192.85 794.41c326.04,12.85 255.97,63.98 323.9,-261.05l193.22 -842.26 -352.7 -5.16c-34.91,71.93 -520.35,733.13 -526.42,737.92 -48.37,-121.85 -102.98,-402.26 -140.97,-546.18 -12.14,-46.03 -30.17,-148.01 -46.48,-188.17l-343.86 -3.63 -255.07 1114.99z" />
          <path d="M779.46 544.86c115.14,-6.94 419.94,-15.26 510.13,22.64 135.56,56.97 113.08,269.22 63.35,405.39 -49.44,135.34 -123.24,235.19 -252.49,273.58 -91.6,27.2 -388.07,35.77 -485.14,20.84l164.15 -722.45zm-491.16 928.61c646.88,1.55 1139.4,117.42 1337.06,-469.05 95.27,-282.66 46.13,-552.24 -201.26,-624.73 -129.98,-38.08 -724.65,-47.38 -873.84,-23.32l-261.96 1117.1z" />
          <path d="M4298.03 868.11c107.57,-30.91 325.36,-51.2 300.85,160.8 -34.41,297.79 -308.63,310.56 -428.1,256.46 -145.15,-65.74 -94.76,-353.47 127.25,-417.26zm-122.48 -90.71c-1.62,-2.79 -2,-11.11 -2.39,-9.38l-24.07 -71.98 -211.72 0.41 -250.2 1082.3c174.19,0.59 237.28,23.57 266.46,-31.78l81.11 -362.5c48.44,37.53 48.85,81.09 207.28,93.96 278.97,22.65 511.53,-39.26 598.58,-341.41 56.6,-196.47 16.97,-375.39 -147.66,-428.18 -162.52,-52.11 -422.94,-38.32 -517.39,68.56z" />
          <path d="M1985.58 1007.78c11.59,-64.8 82.04,-133.01 153.91,-149.65 331.09,-76.67 451.51,147 157.54,153.59 -100.05,2.24 -211.84,1.81 -311.45,-3.94zm567.01 465.52l41.86 -179.04c-127.04,0.44 -252.3,1.17 -377.09,0.81 -139.01,-0.4 -264.93,29.89 -270.24,-125.89 256.93,0.07 702.3,70.36 749.28,-206.64 61.32,-361.61 -525,-292.1 -664.04,-252.56 -285.89,81.31 -402.19,428.7 -311.01,616.34 56.4,116.06 175.83,150.23 337.23,149.98 163.66,-0.25 330.69,1.45 494.01,-3z" />
          <path d="M3030.36 1009.28c19.73,-71.89 79.78,-133.41 154.99,-150.13 341.59,-75.92 435.77,151.3 157.23,153.06 -102.63,0.65 -209.9,1.21 -312.22,-2.93zm536.57 465.58c44.49,-30.45 62.04,-129.76 67.11,-179.42l-553.17 -6.29c-74.72,-14.25 -83.14,-44.39 -88.73,-119.6 245.38,-3.39 711.12,66.98 744.54,-210.04 21.37,-177.14 -64.07,-237.24 -207.52,-264.98 -151.98,-29.4 -473.3,-22.52 -603.7,90.53 -219.46,190.25 -331.8,678.38 151.76,691.33 159.76,4.29 328.86,-1.14 489.71,-1.53z" />
          <path d="M8855.17 1013.94c9.44,-83.55 87.3,-146.27 163.14,-159.12 68.92,-11.68 238.17,-17.81 281.34,26.64 168.43,173.46 -390.72,133.03 -444.48,132.48zm561.53 453.75l38.48 -171.37c-128.36,1.68 -256.38,1.5 -384.16,1.31 -127.69,-0.19 -275.36,21.33 -247.93,-130.68 256.39,-2.28 711.53,75.51 732.33,-219.61 11.34,-160.78 -78.29,-226.63 -218.12,-250.12 -263.89,-44.34 -572.93,-14.62 -705.4,236.64 -118.75,225.24 -126.14,535.71 293.57,537.78 159.36,0.78 333,3.53 491.23,-3.95z" />
          <path d="M6997.96 868.78c146.3,-32.74 314.6,-22.18 302.64,160.56 -8.3,126.74 -84.08,243.79 -211.19,269.03 -448.82,89.13 -353.37,-370.97 -91.45,-429.59zm-41.58 -172.28c-135.63,23.26 -234.14,57.32 -305.16,149.35 -141.5,183.34 -212.42,523.13 62.35,608.81 105.21,32.8 319.11,32.33 432.02,15.27 252.89,-38.22 416.42,-210.44 412.31,-493.33 -4.31,-296.96 -328.67,-326.91 -601.52,-280.1z" />
          <path d="M7840.54 1465.83c321.8,4.6 217.91,51.36 399.92,-182.16l435.18 -585.17 -269.7 -2.33c-21.11,46.86 -57.77,89.92 -88.86,134.79l-247.2 348.16c-8.08,12 -10.37,17.96 -21.48,31.55 -25.15,30.78 -2.22,12.74 -36.52,34.02l-139.75 -546.36 -258.03 -0.96c15.96,63.64 37.48,126.11 56.77,186l81.84 287.93c19.06,73.33 57.63,237.98 87.83,294.53z" />
        </g>
      </svg>
    )
}

export { AppLogo }

