import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext"
import logo from "../src/assets/images/logo.png"
import { Bell, House, LogOut, MessageCircle, Settings, Users } from 'lucide-react';
import { User } from "lucide-react";
import { Link, NavLink } from "react-router-dom"
import Notification from "./Notification";
import NotificationDropdown from "./Notification";
import { useNotifications } from "../contexts/NotificationContext";
const Navbar = ({ }) => {
  const { user, logout } = useAuth();
  const {notifications, unreadCount} = useNotifications();
  

  const [profileClicked, setProfileClicked] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const notificationRef = useRef();

  const dropdownRef = useRef();

  const navItems = [
    {
      title: "Home",
      icon: House,
      path: "/"
    },
    {
      title: "Friends",
      icon: Users,
      path: "/friends"
    },
    {
      title: "Message",
      icon: MessageCircle,
      path: "/message"
    },
    {
      title: "Notifications",
      icon: Bell,
    }
  ]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setProfileClicked(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);
  return (
    <nav className="bg-gray-800 px-3 py-1 flex justify-between items-center fixed w-full top-0 left-0 right-0 border-b border-b-white z-50">
      <img className="sm:h-12 sm:w-18 w-15 h-10" src={logo} alt="" />
      <div className="flex items-center gap-2">
        {
          navItems.map(({ title, icon: Icon, path }) => {
            if (title == "Notifications") {
              return (
                <div
                key={title}
                  ref={notificationRef}
                  className="relative"
                >
                  <button
                    onClick={() =>
                      setShowNotifications((prev) => !prev)
                    }
                    data-title = {title}
                    className={`relative p-3 rounded-xl hover:bg-gray-700 transition-colors duration-700 ${showNotifications && "bg-gray-700 scale-95"}`}
                  >
                    <Bell
                      className="size-5 sm:size-7"
                      color="white"
                    />

                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500"
                      />
                    )}
                  </button>

                  {showNotifications && (
                    <NotificationDropdown
                      notifications={notifications}
                      showUnreadOnly={showUnreadOnly}
                      setShowUnreadOnly={setShowUnreadOnly}
                    />
                  )}
                </div>
              )
            }
            return (
              <NavLink
                key={title}
                data-title={title}
                to={path}

                className={({ isActive }) => `relative p-3 rounded-xl transition-all duration-200 hover:bg-gray-700 active:scale-95 ${isActive && "bg-gray-700 scale-95"}`} >
                <Icon className="size-5 sm:size-7" color="white" />
              </NavLink>
            )
          })
        }
      </div>
      <div ref={dropdownRef}>
        <div id="profile" className="cursor-pointer" onClick={() => setProfileClicked(prev => !prev)}>
          <img src={user.profile_picture} className={`size-12 rounded-full ${profileClicked ? "ring-2 ring-blue-500" : ""}`} alt="" />
        </div>
        {
          profileClicked && (
            <div className="absolute right-0 sm:right-5 sm:top-18 rounded-md bg-gray-800 text-white  w-full border-b sm:border sm:border-gray-700 sm:w-xs flex flex-col z-50">
              <Link to={`/profile/${user.user.username}`} className="px-2 py-4 hover:cursor-pointer rounded-t-md hover:bg-gray-700 focus:bg-gray-700 focus:outline-none flex gap-2"><User /> Profile</Link>
              <Link className="px-2 py-4 hover:cursor-pointer hover:bg-gray-700 focus:bg-gray-700 focus:outline-none flex gap-2"><Settings /> Settings</Link>
              <button className="px-2 py-4 hover:cursor-pointer rounded-b-md hover:bg-gray-700 focus:bg-gray-700 focus:outline-none flex gap-2" onClick={() => logout()}><LogOut />Logout</button>
            </div>
          )
        }
      </div>

    </nav>
  )
}

export default Navbar