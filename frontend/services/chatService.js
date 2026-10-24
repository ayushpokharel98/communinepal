import api from "./api"

const chatService = {
    getConversations: async () => {
        const res = await api.get('/chat/conversation/');
        return res.data;
    },
    createConversation: async (username) => {
        const res = await api.post('/chat/conversation/', { username });
        return res.data;
    },
    getMessages: async (conversation_id, cursor = null) => {
        const params = cursor ? { cursor } : {};
        const res = await api.get(`/chat/messages/${conversation_id}/`, { params });
        return res.data;
    },
    sendMessage: async ({conversation_id, content = "", files = [], mediaTypes = [] }) => {
        const formData = new FormData();
        formData.append("conversation_id", conversation_id)
        formData.append("content", content);
        mediaTypes.forEach((media)=>{
            formData.append("media_types", media)
        });
        files.forEach((file)=>{
            formData.append("uploaded_files", file)
        });
        const res = await api.post(`/chat/message/`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return res.data;
    },
    editMessage: async (message_id, content) => {
        const res = await api.patch(`/chat/message/${message_id}/update/`, { content });
        return res.data;
    },
    deleteMessage: async (message_id) => {
        const res = await api.delete(`/chat/message/${message_id}/update/`);
        return res.data;
    }
}

export default chatService;