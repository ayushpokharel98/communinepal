const PlainButton = ({onClick, type="normal", text, className=""}) => {
    const hoverStyels = {
        normal: "hover:bg-gray-700",
        error: "hover:bg-red-700",
        success: "hover:bg-green-700"
    }
    return (
        <button onClick={onClick} className={`bg-gray-600 p-2 transition duration-300 active:scale-105 rounded-xl ${hoverStyels[type]} ${className}`}>{text}</button>
    )
}

export default PlainButton