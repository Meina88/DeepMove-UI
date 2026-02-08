import { createContext, FunctionalComponent, ComponentChildren, JSX } from "preact"
import { useContext, useState, useRef, useCallback, useMemo } from "preact/hooks"
import { generateUID, removeEntriesByIDs } from "../components/Helpers"

export type ToastType = "error" | "warning" | "success" | "notification";

// Type definitions
interface ToastContent {
	id?: string
    type: ToastType
    content: string | JSX.Element
}

interface Toast extends ToastContent {
	id: string
	updatedAt?: number
}


interface Notification extends Toast {
	time: string
}

interface ToastsContextValue {
	toasts: {
		toastList: Toast[]
		addToast: (toast: Omit<Toast, "id">) => void
		removeToast: (ids: string[]) => void
	}
	notifications: {
		list: Notification[]
		clear: () => void
		isAutoScroll: { current: boolean }
		isAutoScrollPaused: { current: boolean }
	}
}

interface ToastsContextFn {
	toasts: {
		addToast: (toast: Omit<Toast, "id">) => void
		removeToast: (ids: string[]) => void
		toastList: Toast[]
	}
}

interface ToastsContextProviderProps {
	children: ComponentChildren
}

/*
 * Local const
 *
 */
const ToastsContext = createContext<ToastsContextValue | undefined>(undefined)
const useToastsContext = () => {
	const context = useContext(ToastsContext)
	if (!context) {
		throw new Error("useToastsContext must be used within a ToastsContextProvider")
	}
	return context
}

const useToastsContextFn: ToastsContextFn = {} as ToastsContextFn

const ToastsContextProvider: FunctionalComponent<ToastsContextProviderProps> = ({ children }) => {
	const [toasts, setToasts] = useState<Toast[]>([])
	const isNotificationsAutoScroll = useRef<boolean>(true)
	const isNotificationsAutoScrollPaused = useRef<boolean>(false)
	const [notifications, setNotifications] = useState<Notification[]>([])
	const toastsRef = useRef<Toast[]>(toasts)
	toastsRef.current = toasts
	const notificationsRef = useRef<Notification[]>(notifications)
	notificationsRef.current = notifications

const addToast = useCallback((newToast: Omit<Toast, "id">) => {
    const key =
        `${newToast.type}:${
            typeof newToast.content === "string"
                ? newToast.content.trim()
                : "[jsx]"
        }`

    const existingIndex = toastsRef.current.findIndex(t => {
        const existingKey =
            `${t.type}:${
                typeof t.content === "string"
                    ? t.content.trim()
                    : "[jsx]"
            }`
        return existingKey === key
    })

    const now = new Date()
    const time =
        `${now.getHours().toString().padStart(2, "0")
        }:${now.getMinutes().toString().padStart(2, "0")
        }:${now.getSeconds().toString().padStart(2, "0")}`

    if (existingIndex !== -1) {
    const existingToast = toastsRef.current[existingIndex]

    const refreshedToast: Toast = {
        ...existingToast,
        updatedAt: Date.now(), // 👈 reinicia timeout SIN cambiar identidad
    }

    const newToastList = [
        ...toastsRef.current.slice(0, existingIndex),
        refreshedToast,
        ...toastsRef.current.slice(existingIndex + 1),
    ]

    toastsRef.current = newToastList
    setToasts(newToastList)

    // Log histórico sí se refresca
    setNotifications([
        ...notificationsRef.current,
        { ...newToast, id: existingToast.id, time },
    ])

    return
}


const id = generateUID()

setToasts([
    ...toastsRef.current,
    { ...newToast, id, updatedAt: Date.now() },
])

}, [])




	const clearNotifications = useCallback(() => {
		setNotifications([])
	}, [])

	const removeToast = useCallback((uids: string[]) => {
		const remainingIds = removeEntriesByIDs(toastsRef.current, uids)
		toastsRef.current = remainingIds
		setToasts([...remainingIds])
	}, [])

	useToastsContextFn.toasts = { addToast, removeToast, toastList: toasts }

	const store: ToastsContextValue = useMemo(() => ({
		toasts: { toastList: toasts, addToast, removeToast },
		notifications: {
			list: notifications,
			clear: clearNotifications,
			isAutoScroll: isNotificationsAutoScroll,
			isAutoScrollPaused: isNotificationsAutoScrollPaused,
		},
	}), [toasts, notifications, addToast, removeToast, clearNotifications])

	return <ToastsContext.Provider value={store}>{children}</ToastsContext.Provider>
}

export { ToastsContextProvider, useToastsContext, useToastsContextFn }
export type { ToastsContextValue, ToastsContextFn, Toast, Notification, ToastContent }
