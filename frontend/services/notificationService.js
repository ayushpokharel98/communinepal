import api from "./api";

const notificationService = {
    getNotifications: async()=>{
        const res = await api.get("/notifications/");
        return res.data;
    },
    markAsRead: async(notificationId)=>{
        const res = await api.patch(`/notifications/${notificationId}/mark-read/`);
        return res.data;
    },
    markAllAsRead: async()=>{
        const res = await api.patch(`/notifications/mark_all_as_read/`);
        return res.data;
    },
    deleteNotification: async(notificationId)=>{
        const res = await api.delete(`/notifications/${notificationId}/delete/`);
        return res.data;
    },
    deleteAllNotifications: async()=>{
        const res = await api.delete(`notifications/delete_all/`);
        return res.data;
    }
}

export default notificationService;