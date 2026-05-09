import { Link } from "react-router-dom"

const BaseAuthDesign = ({ title, children }) => {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-linear-to-r from-red-500/80 via-indigo-400 to-blue-500">
            <div className="main w-full max-w-md rounded-xl bg-white px-4 py-8 shadow-xl">
                <div className="top text-center text-xl font-semibold">
                    <Link to={"/"} className="text-blue-600">
                        <span className="text-red-600">Communi</span>Nepal
                    </Link>
                    <p className="mt-2">{title}</p>
                </div>
                {children}
            </div>
        </div>
    )
}

export default BaseAuthDesign