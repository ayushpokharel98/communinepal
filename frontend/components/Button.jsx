const Button = ({onClick, text, Component, disabled}) => {
    return (
        <button
            onClick={onClick}
            className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-700 active:scale-[0.98] flex justify-center items-center gap-2 disabled:bg-gray-700 text-white"
            disabled = {disabled}
        >
            {text} {Component && <Component />}
        </button>
    )
}

export default Button