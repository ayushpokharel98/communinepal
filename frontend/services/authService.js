import apiAuth from "./api"
import api from "./api";

const authService = {
    signup: async (data) => {
        const res = await apiAuth.post("/user/register/", data);
        return res.data;
    },
    verifyEmail: async (data) => {
        const res = await apiAuth.post("/user/verify-email/", data);
        return res.data;
    },

    resendVerification: async (email) => {
        const res = await apiAuth.post("/user/resend-verification/", { email });
        return res.data;
    },

    login: async (data) => {
        const res = await apiAuth.post("/user/token/", data);
        return res.data;
    },

    logout: async () => {
        const res = await api.post("/user/logout/");
        return res.data;
    },

    forgotPassword: async (email) => {
        const res = await apiAuth.post("/user/forgot-password/", { email });
        return res.data;
    },

    validateResetToken: async (params) => {
        const res = await apiAuth.get("/user/reset-password/", { params });
        return res.data;
    },

    resetPassword: async (data) => {
        const res = await apiAuth.post("/user/reset-password/", data);
        return res.data;
    },

    searchUsers: async(query) =>{
        const res = await api.get("user/users/", {params: {search:query}});
        return res.data;
    },

    getMe: async () => {
        const res = await api.get("/user/me/");
        return res.data;
    },

    getUserById: async (id) => {
        const res = await api.get(`/user/${id}/`);
        return res.data;
    },
};

export default authService;
