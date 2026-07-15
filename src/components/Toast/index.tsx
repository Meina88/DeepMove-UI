/*
 Toast.tsx - ESP3D WebUI component file
 
 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 
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
import { useEffect } from "preact/hooks"
import { useUiContextFn, useToastsContext } from "../../contexts"
import { Toast as SpectreToast } from "../Controls"
import { T } from "../Translations"

const Toast = ({ index, type = "", children, timeout = 2000, remove, updatedAt }: any) => {

useEffect(() => {
  if (!timeout) return

  const timer = setTimeout(() => {
    remove(index)
  }, timeout)

  return () => clearTimeout(timer)
}, [updatedAt])


  return (
    <SpectreToast {...{ [type]: true }}>
      <SpectreToast.Close
        onClick={() => {
          useUiContextFn.haptic()
          remove(index)
        }}
      />
      {children}
    </SpectreToast>
  )
}

const ToastsContainer = () => {
  const { toasts } = useToastsContext()
  return (
    toasts.toastList && (
      <div class="toasts-container">
        {toasts.toastList.map((toast: any) => {
          const { id, type, content, updatedAt } = toast

          return (
            <Toast
              remove={(id: any) => toasts.removeToast([String(id)])}
              index={id}
              type={type}
              key={id}
              updatedAt={updatedAt}
            >
              {typeof content === 'string' ? T(content) : content}
            </Toast>
          )
        })}
      </div>
    )
  )
}

export { ToastsContainer }
