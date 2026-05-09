import React from 'react'
import Loading from '../Loading'

const AuthButton = ({isSubmitting, name}) => {
    return (
        <div className="flex justify-center">
            <button
                type="submit"
                className="rounded-md bg-red-400 px-18 py-2 hover:bg-blue-400 transition-all duration-300 ease-in-out"
                disabled={isSubmitting}
            >
                {isSubmitting ? <Loading /> : name}
            </button>
        </div>
    )
}

export default AuthButton