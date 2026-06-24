import api from "./api"

const chatService = {
    getConversations: async() => {
        const res = await api.get('/chat/conversation/');
        return res.data;
    },
    createConversation: async(username)=>{
        const res = await api.post('/chat/conversation/', {username});
        return res.data;
    },
    getMessages: async(conversation_id, cursor=null)=>{
        const params = cursor ? {cursor} : {};
        const res = await api.get(`/chat/timeline/${conversation_id}/`, {params});        
        return res.data;
    },
    sendMessage: async(conversation_id, data)=>{
        const res = await api.post(`/chat/message/${conversation_id}/`,data);
        return res.data;
    },
    editMessage: async(message_id, content)=>{
        const res = await api.patch(`/chat/message/${message_id}/update/`, {content});
        return res.data;
    },
    deleteMessage: async(message_id) =>{
        const res = await api.delete(`/chat/message/${message_id}/update/`);
        return res.data;
    }
}

export default chatService;