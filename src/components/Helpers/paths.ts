/*
 paths.ts - ESP3D WebUI helpers file

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

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = new RegExp("[\\u0000-\\u001f\\u007f]")

// Rejects directory traversal / control characters in a filesystem path or
// filename segment before it reaches an FLASH/DIRECTSD command builder.
// Returns null when the value is unsafe; an empty string is a valid root path.
const sanitizePathSegment = (value: unknown): string | null => {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    if (trimmed.length === 0) return trimmed
    if (CONTROL_CHARS_RE.test(trimmed)) return null
    if (trimmed.includes("..")) return null
    if (trimmed.includes("\\")) return null
    return trimmed
}

export { sanitizePathSegment }
