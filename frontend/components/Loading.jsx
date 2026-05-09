import React from 'react'

const Loading = ({type=0}) => {
  return (
    <div className={`flex justify-center items-center ${type?"w-full h-screen bg-gray-200/30":"bg-transparent"}`}>
        <div className={`rounded-full border-t-transparent border-4 animate-spin ${type?"w-16 h-16 border-blue-400":"w-8 h-8 border-white"}`}>
        </div>
    </div>
  )
}

export default Loading