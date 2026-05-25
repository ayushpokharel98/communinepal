import React, { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import authService from '../services/authService';

const EditProfileModal = ({ profile, onClose, onSave }) => {
  const originalForm = {
    bio: profile?.bio || '',
    website: profile?.website || '',
    phone_number: profile?.phone_number || '',
    gender: profile?.gender || '',
    date_of_birth: profile?.date_of_birth || '',
    address: profile?.address || '',
  };

  const [form, setForm] = useState(originalForm);
  const [errors, setErrors] = useState({});
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [coverPicFile, setCoverPicFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(profile?.profile_picture);
  const [coverPreview, setCoverPreview] = useState(profile?.cover_picture);
  const [loading, setLoading] = useState(false);

  const profileInputRef = useRef();
  const coverInputRef = useRef();

  const isFormChanged = JSON.stringify(form) !== JSON.stringify(originalForm);
  const hasChanges = isFormChanged || profilePicFile !== null || coverPicFile !== null;

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'profile') {
      setProfilePicFile(file);
      setProfilePreview(url);
    } else {
      setCoverPicFile(file);
      setCoverPreview(url);
    }
  };

  const handleRevertProfile = (e) => {
    e.stopPropagation();
    setProfilePicFile(null);
    setProfilePreview(profile?.profile_picture);
    profileInputRef.current.value = '';
  };

  const handleRevertCover = (e) => {
    e.stopPropagation();
    setCoverPicFile(null);
    setCoverPreview(profile?.cover_picture);
    coverInputRef.current.value = '';
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (profilePicFile) formData.append('profile_picture', profilePicFile);
      if (coverPicFile) formData.append('cover_picture', coverPicFile);

      const updated = await authService.updateProfile(formData);
      onSave(updated);
      onClose();
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={22} />
          </button>
        </div>

        {/* Cover Image */}
        <div className="relative h-40 md:h-52 bg-gray-800">
          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover opacity-80" />

          {/* Remove the input from inside the button */}
          <button
            type="button"
            onClick={() => coverInputRef.current.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition group"
          >
            <Camera size={28} className="text-white opacity-70 group-hover:opacity-100" />
          </button>

          {/* Input lives outside the button */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageChange(e, 'cover')}
          />

          {coverPicFile && (
            <button
              type="button"
              onClick={handleRevertCover}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition z-10"
            >
              <X size={16} />
            </button>
          )}

          {/* Profile Picture (overlapping cover) */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative size-24 rounded-full border-4 border-gray-900">
              <img
                src={profilePreview}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
              <button
                onClick={() => profileInputRef.current.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 transition"
              >
                <Camera size={18} className="text-white" />
              </button>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, 'profile')}
              />

              {/* Revert profile button */}
              {profilePicFile && (
                <button
                  onClick={handleRevertProfile}
                  className="absolute -top-1 -right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 transition z-10"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-16 pb-6 space-y-4">
          {[
            { label: 'Bio', name: 'bio', type: 'textarea' },
            { label: 'Website', name: 'website', type: 'text' },
            { label: 'Phone Number', name: 'phone_number', type: 'text' },
            { label: 'Date of Birth', name: 'date_of_birth', type: 'date' },
            { label: 'Address', name: 'address', type: 'text' },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full bg-gray-800 text-white rounded-xl px-4 py-3 border focus:outline-none resize-none
          ${errors[name] ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'}`}
                />
              ) : (
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className={`w-full bg-gray-800 text-white rounded-xl px-4 py-3 border focus:outline-none
          ${errors[name] ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'}`}
                />
              )}
              {/* Error message */}
              {errors[name] && (
                <p className="text-red-400 text-xs mt-1 ml-1">{errors[name][0]}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select gender</option>
              <option value="m">Male</option>
              <option value="f">Female</option>
              <option value="n">Prefer not to say</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !hasChanges}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditProfileModal;