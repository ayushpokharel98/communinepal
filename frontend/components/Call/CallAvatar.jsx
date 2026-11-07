import { getDisplayName } from "../../services/callUtils";

const CallAvatar = ({ user, className = "h-24 w-24", textClass = "text-3xl", include_url=false }) =>
    user?.profile_picture ? (
        <img
            src={`${include_url ? import.meta.env.VITE_BASE_URL : ""}${user.profile_picture}`}
            alt={getDisplayName(user)}
            className={`${className} rounded-full object-cover bg-gray-700`}
        />
    ) : (
        <div
            className={`${className} ${textClass} rounded-full bg-gray-700 flex items-center justify-center font-semibold text-white`}
        >
            {getDisplayName(user).charAt(0).toUpperCase()}
        </div>
    );

export default CallAvatar;