import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

export const apiAuth = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

const EXCLUDED_STRINGS = [
    "/token/refresh/",
    "/register/",
    "/resend-verification/",
    "/token/",
    "/logout/",
    "/forgot-password/",
    "/reset-password/",
]

let isRefreshing = false;
let subscribers = [];

function subscribeTokenRefresh(cb) {
    subscribers.push(cb);
}

function onRefreshed(success) {
    subscribers.forEach((cb) => cb(success));
    subscribers = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            EXCLUDED_STRINGS.some((url) =>
                originalRequest.url?.includes(url)
            )
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((success) => {
                    if (success) resolve(api(originalRequest));
                    else reject(error);
                });
            });
        }

        isRefreshing = true;

        try {
            await apiAuth.post("/user/token/refresh/");
            isRefreshing = false;
            onRefreshed(true);
            return api(originalRequest);
        } catch (err) {
            isRefreshing = false;
            onRefreshed(false);
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(err);
        }
    }
);

export default api;
