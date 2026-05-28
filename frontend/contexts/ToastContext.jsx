import { createContext, useContext, useState } from "react"
import Toast from "../components/Toast";

const ToastContext = createContext(null);
export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ message: "", type: "" });
    const showToast = (message, type = "success", duration = 5000) => {
        setToast({ message, type, duration })
    }
    const success = (message, duration) => showToast(message, "success", duration);
    const error = (message, duration) => showToast(message, "error", duration);
    const info = (message, duration) => showToast(message, "info", duration);
    const warning = (message, duration) => showToast(message, "warning", duration);

    const setMessage = (message) => setToast((prev) => ({ ...prev, message }));

    const values = {
        showToast,
        success,
        error,
        info,
        warning
    }

    return (
        <ToastContext.Provider value={values}>
            {children}
            <Toast
                type={toast.type}
                message={toast.message}
                setMessage={setMessage}
                duration={toast.duration}
            />
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext);