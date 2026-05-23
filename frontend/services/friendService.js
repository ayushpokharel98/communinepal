import api from "./api";

const friendService = {
    sentRequests: async()=>{
        const res = await api.get("/user/friends/sent/");
        return res.data;
    },
    receivedRequests: async()=>{
        const res = await api.get("/user/friends/pending/");
        return res.data;
    },
    sendRequest: async(userId)=>{
        const res = await api.post(`/user/friends/send/${userId}/`)
        return res.data;
    },
    acceptRequest: async(freindshipId)=>{
        const res = await api.post(`/user/friends/accept/${freindshipId}/`)
        return res.data;
    },
    rejectRequest: async(freindshipId)=>{
        const res = await api.post(`/user/friends/reject/${freindshipId}/`)
        return res.data;
    },
    cancelRequest: async(freindshipId)=>{
        const res = await api.post(`/user/friends/cancel/${freindshipId}/`)
        return res.data;
    },
    viewAllFriends: async()=>{
        const res = await api.get(`/user/friends/`)
        return res.data;
    },
    removeFriend: async(freindshipId)=>{
        const res = await api.delete(`/user/friends/remove/${freindshipId}/`)
        return res.data;
    },
}

export default friendService;