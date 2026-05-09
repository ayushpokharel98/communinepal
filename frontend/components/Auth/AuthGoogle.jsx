import Google from "../../src/assets/Google"
const AuthGoogle = () => {
    return (
        <>
            <div className="flex items-center my-4">
                <div className="grow border-t border-gray-400"></div>
                <span className="shrink mx-4 text-gray-500">OR</span>
                <div className="grow border-t border-gray-400"></div>
            </div>
            <div className='flex justify-center'>
                <div className='flex items-center gap-2 rounded-md hover:bg-red-400 px-18 py-2 bg-blue-400 transition-all duration-300'>
                    Continue with Google <Google />
                </div>
            </div>
        </>
    )
}

export default AuthGoogle