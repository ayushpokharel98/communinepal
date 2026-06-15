import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useParams, Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { Pen, UserPlus } from 'lucide-react';
import Button from '../components/Button';
import Loading from '../components/Loading';
import PlainButton from '../components/PlainButton';
import friendService from '../services/friendService';
import Posts from '../components/Posts';
import About from '../components/About';
import EditProfileModal from '../components/EditProfileModal';
import postService from '../services/postService';
import { useToast } from '../contexts/ToastContext';
import Shares from '../components/Shares';

const Profile = () => {
  const { username } = useParams();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {

    const fetchProfileAndPosts = async () => {

      try {
        setLoading(true);
        if (username === user.user.username) {
          setProfile(user);
        } else {
          const profileRes = await authService.getUser(username);
          setProfile(profileRes);
        }
      } catch (err) {
        console.log(err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPosts();

  }, [username]);

  const handleAddFriend = async (userId) => {
    try {
      await friendService.sendRequest(userId);

      setProfile({ ...profile, request_pending: true })

      success("Friend Request Sent!");

    } catch (err) {
      console.log(err);

      error("Something went wrong, try again later!");
    }
  };

  const handleProfileSave = ({ bio, website, phone_number, date_of_birth, address, cover_picture, gender, profile_picture }) => {
    setProfile({ ...profile, bio, website, phone_number, date_of_birth, address, cover_picture, gender, profile_picture });
    setUser({ ...user, bio, website, phone_number, date_of_birth, address, cover_picture, gender, profile_picture })
  };

  return loading ? <Loading type={1} /> : (
    <>
      <Navbar />
      <main className="w-full mt-15 min-h-[calc(100vh-60px)] bg-gray-900 flex justify-center px-4 overflow-auto text-white">
        {
          !profile ? (<div className="w-full min-h-[calc(100vh-60px)] flex items-center justify-center text-gray-400 text-2xl text-center">
            No Profile Found
          </div>) : (
            <div className="w-full max-w-7xl">

              <div className="relative mt-2 h-45 md:h-80 lg:h-96 rounded-2xl shadow-xl">
                <img
                  className="w-full h-full object-cover opacity-85"
                  src={profile.cover_picture}
                  alt="Cover"
                />

                <img
                  className="absolute left-1/2 -translate-x-1/2 -bottom-18 size-32 md:size-40 rounded-full border-4 border-gray-900 object-cover bg-black shadow-2xl hover:scale-105 transition duration-300 cursor-pointer"
                  src={profile.profile_picture}
                  alt="Profile"
                />
              </div>

              <div className="mt-20 sm:relative flex-col sm:flex-row flex items-center justify-between sm:justify-end sm:min-h-24">
                <div className="sm:absolute sm:top-0 sm:left-1/2 sm:-translate-x-1/2 text-center">
                  <h1 className="text-xl w-full sm:text-3xl font-bold text-white text-wrap sm:text-nowrap">
                    {profile.user?.full_name}
                  </h1>

                  <p className="text-gray-400 mt-1">
                    @{profile.user?.username}
                  </p>

                  <p className="text-gray-300 mt-2 text-sm md:text-base">
                    {profile.bio || "No bio added yet."}
                  </p>
                </div>

                <div>
                  {username === user.user.username ? (
                    <Button
                      text="Edit your Profile"
                      Component={Pen}
                      className={'px-24 sm:px-4'}
                      onClick={() => setShowEditModal(true)}
                    />
                  ) : (
                    <Button
                      text={
                        profile.is_friend
                          ? "Already Friends"
                          : profile.request_pending
                            ? "Request exists"
                            : "Add Friend"
                      }
                      Component={
                        profile.is_friend || profile.request_pending
                          ? null
                          : UserPlus
                      }
                      disabled={
                        profile.is_friend || profile.request_pending
                      }
                      className={'px-24 sm:px-4'}
                      onClick={() => handleAddFriend(profile.user.id)}
                    />
                  )}
                </div>
              </div>
              <p className="text-gray-500 text-center mt-2 text-sm md:text-base">
                {profile.posts_count} {profile.posts_count === 1 ? "post" : "posts"}
              </p>
              <div className="flex justify-center mt-3 mb-6 gap-2">
                <NavLink
                  end
                  to={`/profile/${username}`}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg ${isActive ? "bg-gray-700" : "bg-gray-800"
                    }`
                  }
                >
                  Posts
                </NavLink>

                <NavLink
                  to={`/profile/${username}/about`}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg ${isActive ? "bg-gray-700" : "bg-gray-800"
                    }`
                  }
                >
                  About
                </NavLink>

                <NavLink
                  to={`/profile/${username}/shares`}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg ${isActive ? "bg-gray-700" : "bg-gray-800"
                    }`
                  }
                >
                  Shares
                </NavLink>
              </div>
              <Outlet
                context={{
                  profile,
                  username,
                }}
              />            </div>
          )
        }

      </main>

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileSave}
        />
      )}
    </>
  )
}

export default Profile