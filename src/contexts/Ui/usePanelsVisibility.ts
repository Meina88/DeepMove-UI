/*
 usePanelsVisibility.ts - panel list/order/visibility state used by UiContext.

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

import { useState, useRef, useCallback } from "preact/hooks"

export interface Panel {
    id: string
    settingid?: string
    [key: string]: unknown
}

export interface PanelsOrderEntry {
    index: number
    id: string
}

export interface PanelsVisibility {
    list: Panel[]
    set: (panels: Panel[]) => void
    visibles: Panel[]
    setVisibles: (panels: Panel[]) => void
    hide: (id: string) => void
    show: (id: string, fixed: boolean) => void
    isVisible: (id: string) => boolean
    initDone: boolean
    setInitDone: (done: boolean) => void
    setPanelsOrder: (order: PanelsOrderEntry[]) => void
    updateTrigger: number
}

export function usePanelsVisibility(): PanelsVisibility {
    const [panelsList, setPanelsList] = useState<Panel[]>([])
    const [panelsOrder, setPanelsOrder] = useState<PanelsOrderEntry[]>([])
    const visiblePanelsListRef = useRef<Panel[]>([])
    const [updateTrigger, setUpdateTrigger] = useState<number>(0)
    const [initPanelsVisibles, setInitPanelsVisibles] = useState<boolean>(false)

    const removeFromVisibles = useCallback((id: string) => {
        visiblePanelsListRef.current = visiblePanelsListRef.current.filter(
            (element) => element.id != id
        )
        setUpdateTrigger((prev) => prev + 1)
    }, [])

    const addToVisibles = useCallback((id: string, fixed: boolean) => {
        if (fixed && panelsOrder.length > 0) {
            const unSortedVisiblePanelsList = [
                ...visiblePanelsListRef.current.filter((element) => element.id != id),
                ...panelsList.filter((element) => element.id == id),
            ]
            visiblePanelsListRef.current = panelsOrder.reduce((acc: Panel[], panel) => {
                const paneldesc = unSortedVisiblePanelsList.filter(
                    (p) => p.settingid == panel.id
                )
                if (paneldesc.length > 0) acc.push(...paneldesc)
                return acc
            }, [])
        } else {
            visiblePanelsListRef.current = [
                ...panelsList.filter((element) => element.id == id),
                ...visiblePanelsListRef.current.filter((element) => element.id != id),
            ]
        }
        setUpdateTrigger((prev) => prev + 1)
    }, [panelsList, panelsOrder])

    const isPanelVisible = useCallback((id: string): boolean => {
        return visiblePanelsListRef.current.some((element) => element.id == id)
    }, [])

    const setVisibles = useCallback((newList: Panel[]) => {
        visiblePanelsListRef.current = newList
        setUpdateTrigger((prev) => prev + 1)
    }, [])

    return {
        list: panelsList,
        set: setPanelsList,
        visibles: visiblePanelsListRef.current,
        setVisibles,
        hide: removeFromVisibles,
        show: addToVisibles,
        isVisible: isPanelVisible,
        initDone: initPanelsVisibles,
        setInitDone: setInitPanelsVisibles,
        setPanelsOrder,
        updateTrigger,
    }
}
