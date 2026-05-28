import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar';
import CreatePost from '../components/CreatePost';
import Posts from '../components/Posts';

const Home = () => {
  const {user, logout} = useAuth();
  return (
    <>
      <Navbar />
      <main className='w-full mt-15 min-h-[calc(100vh-60px)] bg-gray-900 p-3'>
      <Posts type={"main"}/>
      </main>
    </>
  )
}

export default Home