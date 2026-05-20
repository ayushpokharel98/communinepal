import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar';

const Home = () => {
  const {user, logout} = useAuth();
  return (
    <div>
      <Navbar />
    </div>
  )
}

export default Home