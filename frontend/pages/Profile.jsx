import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { Pen, UserPlus } from 'lucide-react';
import Button from '../components/Button';
import Loading from '../components/Loading';
import PlainButton from '../components/PlainButton';
import Toast from '../components/Toast';
import friendService from '../services/friendService';
import Posts from '../components/Posts';
import About from '../components/About';
import EditProfileModal from '../components/EditProfileModal';

const Profile = () => {
  const { username } = useParams();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    type: "",
    message: ""
  });
  const [selectedTab, setSelectedTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (username === user.user.username) {
        setProfile(user);
        setLoading(false);
        return;
      };

      try {
        setLoading(true);
        const res = await authService.getUser(username);
        setProfile(res);
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }

    }
    fetchProfile();

  }, [username])

  const handleAddFriend = async (userId) => {
    try {
      await friendService.sendRequest(userId);

      setProfile({ ...profile, request_pending: true })

      setToast({
        type: "success",
        message: "Friend request sent!"
      });

    } catch (err) {
      console.log(err);

      setToast({
        type: "error",
        message: "Something went wrong, try again later!"
      });
    }
  };

  const handleProfileSave = ({bio, website, phone_number, date_of_birth, address, cover_picture, gender, profile_picture}) => {
    setProfile({...profile, bio, website, phone_number, date_of_birth, address, cover_picture, gender, profile_picture});
    setUser({...user, bio, website, phone_number, date_of_birth, address, cover_picture, gender, profile_picture})
  };

  return loading ? <Loading type={1} /> : (
    <>
      <Navbar />
      <Toast type={toast.type} message={toast.message} setMessage={(msg) => setToast({ ...toast, message: msg })} />
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

              <div className='flex justify-center mt-3 mb-6'>
                <PlainButton text={"Posts"} className={`mr-2 px-4 ${selectedTab === "posts" && "bg-gray-700"}`} onClick={() => setSelectedTab("posts")} />
                <PlainButton text={"About"} className={`px-4 ${selectedTab === "about" && "bg-gray-700"}`} onClick={() => setSelectedTab("about")} />
              </div>
              {
                selectedTab === "posts" ? <Posts /> : <About user={profile} />
              }
            </div>
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