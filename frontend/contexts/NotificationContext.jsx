import { createContext, useContext, useEffect, useRef, useState } from "react";
import notificationService from "../services/notificationService";
import { useToast } from "./ToastContext";
import NotificationToast from "../components/NotificationToast";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connected, setConnected] = useState(false);

    const [toastQueue, setToastQueue] = useState([]);
    const [activeToast, setActiveToast] = useState(null);

    const { error } = useToast();

    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const enqueueToast = (notification) => {
        setToastQueue((prev) => [...prev, notification]);
    };

    const connectSocket = () => {
        if (
            socketRef.current &&
            (
                socketRef.current.readyState === WebSocket.OPEN ||
                socketRef.current.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        const socket = new WebSocket(
            "ws://localhost:8000/ws/notifications/"
        );

        socketRef.current = socket;

        socket.onopen = () => {
            console.log("Notification connected successfully!");
            setConnected(true);
        };

        socket.onmessage = (event) => {
            const notification = JSON.parse(event.data);

            setNotifications((prev) => {
                const exists = prev.some(
                    (item) => item.id === notification.id
                );

                if (exists) {
                    return prev;
                }

                enqueueToast(notification);

                return [notification, ...prev];
            });

            setUnreadCount((prev) => prev + 1);
        };

        socket.onerror = (err) => {
            console.error("Notification socket error:", err);
        };

        socket.onclose = () => {
            console.log("Notification disconnected!");
            setConnected(false);

            reconnectTimeoutRef.current = setTimeout(() => {
                connectSocket();
            }, 3000);
        };
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await notificationService.getNotifications();

                setNotifications(res.notifications || []);
                setUnreadCount(res.unread_count || 0);
            } catch {
                error("Error fetching notifications, please try again later!");
            }
        };

        fetchNotifications();
        connectSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (activeToast || toastQueue.length === 0) {
            return;
        }

        const nextToast = toastQueue[0];

        setActiveToast({
            ...nextToast,
            toastId: crypto.randomUUID(),
        });

        setToastQueue((prev) => prev.slice(1));
    }, [toastQueue, activeToast]);


    useEffect(() => {
        if (!activeToast) {
            return;
        }

        const timer = setTimeout(() => {
            setActiveToast(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [activeToast]);

    const values = {
        notifications,
        unreadCount,
        connected,
        setNotifications,
        setUnreadCount,
    };

    return (
        <NotificationContext.Provider value={values}>
            {children}

            {activeToast && (
                <NotificationToast
                    activeToasts={[activeToast]}
                />
            )}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;

export function useNotifications() {
    return useContext(NotificationContext);
}