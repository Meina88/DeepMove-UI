/*
 sanitizeHtml.ts - ESP3D WebUI helpers file

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

// Minimal allowlist sanitizer for extension-provided modal HTML (no external
// dependency): only these tags/attributes survive, everything else is unwrapped
// (children kept, tag dropped) or, for attributes, simply omitted.
const ALLOWED_TAGS = new Set([
    "div",
    "span",
    "p",
    "br",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "small",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "hr",
])

const ALLOWED_ATTRS: Record<string, string[]> = {
    a: ["href", "target", "rel"],
}

const GLOBAL_ATTRS = ["class"]

const SAFE_HREF_RE = /^(https?:|mailto:)/i

const sanitizeNode = (node: Node, out: Node): void => {
    for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
            out.appendChild(document.createTextNode(child.textContent || ""))
            continue
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue

        const el = child as Element
        const tag = el.tagName.toLowerCase()
        if (!ALLOWED_TAGS.has(tag)) {
            // Unwrap: keep the safe children, drop the disallowed tag itself
            sanitizeNode(el, out)
            continue
        }

        const clean = document.createElement(tag)
        const allowedAttrs = [...GLOBAL_ATTRS, ...(ALLOWED_ATTRS[tag] || [])]
        for (const attr of allowedAttrs) {
            if (!el.hasAttribute(attr)) continue
            const value = el.getAttribute(attr) || ""
            if (attr === "href" && !SAFE_HREF_RE.test(value.trim())) continue
            clean.setAttribute(attr, value)
        }
        if (tag === "a") clean.setAttribute("rel", "noopener noreferrer")

        sanitizeNode(el, clean)
        out.appendChild(clean)
    }
}

const sanitizeHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html")
    const container = document.createElement("div")
    sanitizeNode(doc.body, container)
    return container.innerHTML
}

// Allowlist sanitizer for user-provided custom-logo markup (imported from a
// preferences.json file, so untrusted). Purely presentational vector tags -
// deliberately no <script>, <foreignObject>, <image>/href (unneeded for a
// logo), no "style" attribute (CSS-exfil vector), and no "on*" handlers:
// those simply aren't in the allowlist below, so they're dropped like any
// other disallowed attribute.
const ALLOWED_SVG_TAGS = new Set([
    "svg",
    "g",
    "path",
    "circle",
    "rect",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "defs",
    "lineargradient",
    "radialgradient",
    "stop",
    "clippath",
    "use",
    "title",
])

// DOM attribute lookups on foreign (SVG) elements are case-sensitive, so the
// declared case here matters - this is the real attribute name to look up,
// not just a display label.
const ALLOWED_SVG_ATTRS = [
    "fill",
    "stroke",
    "stroke-width",
    "d",
    "viewBox",
    "width",
    "height",
    "x",
    "y",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x1",
    "y1",
    "x2",
    "y2",
    "points",
    "transform",
    "offset",
    "stop-color",
    "stop-opacity",
    "fill-rule",
    "clip-rule",
    "class",
    "id",
    "shape-rendering",
    "text-rendering",
    "xmlns",
]

const sanitizeSvgNode = (node: Node, out: Node): void => {
    for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
            out.appendChild(document.createTextNode(child.textContent || ""))
            continue
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue

        const el = child as Element
        const tag = el.tagName.toLowerCase()
        if (!ALLOWED_SVG_TAGS.has(tag)) {
            // Unwrap: keep the safe children, drop the disallowed tag itself
            sanitizeSvgNode(el, out)
            continue
        }

        const clean = document.createElementNS("http://www.w3.org/2000/svg", tag)
        for (const attr of ALLOWED_SVG_ATTRS) {
            if (!el.hasAttribute(attr)) continue
            clean.setAttribute(attr, el.getAttribute(attr) || "")
        }

        sanitizeSvgNode(el, clean)
        out.appendChild(clean)
    }
}

const sanitizeSvg = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html")
    const container = document.createElement("div")
    sanitizeSvgNode(doc.body, container)
    return container.innerHTML
}

export { sanitizeHtml, sanitizeSvg }
