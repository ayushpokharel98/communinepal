import React, { useEffect } from 'react';
import { X } from "lucide-react"
const Toast = ({ type = "success", message, setMessage, duration = 5000 }) => {
    const styles = {
        success: "bg-green-100 text-green-800 border-green-300",
        error: "bg-red-100 text-red-800 border-red-300",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
        info: "bg-blue-100 text-blue-800 border-blue-300",
    };

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            setMessage("");
        }, duration);
        return () => clearTimeout(timer);

    }, [message, duration, setMessage]);

    if (!message) return null;

    return (
        <div className="fixed top-5 right-5 z-50 animate-slideIn">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-62.5 ${styles[type]}`}>

                <p className="text-sm font-medium flex-1">{message}</p>

                <button
                    onClick={() => setMessage("")}
                    className="hover:opacity-70 transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;