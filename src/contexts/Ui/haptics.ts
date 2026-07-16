/*
 haptics.ts - low-level vibration-pattern trigger used by UiContext's haptic helper.

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 Modified by Luc LEBOSSE 2021

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

export function vibrate(enabled: boolean, pattern?: number | number[]): void {
    if (!window || !window.navigator || !window.navigator.vibrate) return
    if (!enabled) return

    const vibPattern = pattern ?? 50
    window.navigator.vibrate(vibPattern)
}
