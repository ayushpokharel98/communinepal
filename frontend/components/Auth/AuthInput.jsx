const AuthInput = ({ type, name = type, label, placeholder, error, ...rest }) => {
    return (
        <div className="flex flex-col gap-2 py-2">
            <label htmlFor={name} className="text-sm text-gray-600">{label}</label>
            <input
                type={type}
                name={name}
                id={name}
                className="rounded-sm border border-red-400 p-2 placeholder:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={placeholder}
                autoComplete="off"
                {...rest}

            />
            {error &&
                <div className="text-xs px-2 text-red-500 whitespace-pre-line">
                    <p>{error}</p>
                </div>
            }

        </div>
    )
}

export default AuthInput