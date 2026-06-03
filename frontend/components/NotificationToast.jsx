import React from 'react'

const NotificationToast = ({activeToasts}) => {
    return (
        <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-3 pointer-events-none text-white">
            {activeToasts.map((toast) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto min-w-12 max-w-sm bg-gray-900 border border-gray-700 text-white rounded-xl p-4 shadow-lg animate-notification"
                >
                    <p className="font-semibold">
                        {toast.title || "New Notification"}
                    </p>

                    {toast.message && (
                        <p className="text-sm text-white mt-1">
                            {toast.message}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}

export default NotificationToast