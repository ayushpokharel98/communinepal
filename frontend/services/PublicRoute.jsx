import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom';
import Loading from '../components/Loading';

const PublicRoute = ({children}) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) return <Loading type={1} />;
    if (isAuthenticated) return <Navigate to="/" replace />;
    return children;
}
export default PublicRoute