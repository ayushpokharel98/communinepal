import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import authService from "../services/authService";
import Loading from "../components/Loading";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        const initAuth = async() => {
            try{
                const me = await authService.getMe();
                setUser(me);
            }catch{
                setUser(null);
            }finally{
                setLoading(false);
            }
        };

        initAuth();

        const handleLogout = async() => {
            try{
                await authService.logout();
            }catch{

            }finally{
                setUser(null);
            }
        }

        window.addEventListener('auth:logout', handleLogout);
        return ()=> window.removeEventListener('auth:logout', handleLogout)
    }, [])

    const login = async(data) => {
        const res = await authService.login(data);
        const me = await authService.getMe();
        setUser(me)
        return res
    };

    const logout = async() => {
        await authService.logout();
        setUser(null);
    }

    const value = {
        user,
        setUser,
        loading,
        isAuthenticated: !!user,
        login,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {loading? <Loading type={1} /> : children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => useContext(AuthContext);