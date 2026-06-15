const PlainButton = ({ onClick, type = "normal", text, className = "", Component=null, disabled, title }) => {
    const hoverStyels = {
        normal: "hover:bg-gray-700",
        error: "hover:bg-red-700",
        success: "hover:bg-green-700",
        love: "hover:bg-red-500",
        share: "hover:bg-blue-400"
    }
    return (
        <button title={title} onClick={onClick} className={`bg-gray-600 text-center p-2 flex gap-2 items-center justify-center transition duration-300 active:scale-105 rounded-xl ${hoverStyels[type]} ${className}`} disabled={disabled}>{text}{Component && <Component />}</button>
    )
}

export default PlainButton