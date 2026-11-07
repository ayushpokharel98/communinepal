const SESSION_KEY = "active_call_session";
const SESSION_TTL = 5000;

export const getDisplayName = (user) =>
    user?.full_name || user?.username || "Unknown user";

export const formatDuration = (total) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const markCallSessionActive = () => {
    try { localStorage.setItem(SESSION_KEY, String(Date.now())); } catch { /* ignore */ }
};

export const clearCallSession = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
};

export const isCallSessionActive = () => {
    try {
        const ts = Number(localStorage.getItem(SESSION_KEY));
        return ts > 0 && Date.now() - ts < SESSION_TTL;
    } catch {
        return false;
    }
};

export const openCallWindow = (params) => {
    const url = `/call?${new URLSearchParams(params).toString()}`;
    const win = window.open(url, "_blank");
    if (win) markCallSessionActive();
    return Boolean(win);
};