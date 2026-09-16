
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config.js';

const UserCard = ({ user, onEdit, onDelete, isAdmin }) => {

  const navigate = useNavigate();

  const isSelf = auth.currentUser?.uid === (user.uid || user.id);

  // 🔹 Sirf Admin ke liye uska apna card hide hoga.
  // Normal users ko unka card (Profile Record) HAMESHA dikhega.
  if (isAdmin && isSelf) {
    return null;
  }

  const formattedDate = user.createdAt?.toDate
    ? user.createdAt.toDate().toLocaleDateString()
    : 'N/A';

  const imageUrl = user.photoURL || user.profileImg;

  // 🔹 Open selected user in URL
  const handleCardClick = () => {
    if (isAdmin) {
      navigate(`/admin/user/${user.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white cursor-pointer p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition"
    >

      {/* Upper Content */}
      <div className="flex flex-col items-center text-center">

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={user.fullName || "User Profile"}
            className="h-[120px] w-[120px] rounded-full object-cover shadow-sm mb-4 border-2 border-blue-100"
          />
        ) : (
          <div className="h-[120px] w-[120px] rounded-full bg-blue-600 text-white font-bold text-3xl flex items-center justify-center mb-4 shadow-sm">
            {user.fullName
              ? user.fullName[0].toUpperCase()
              : 'U'}
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {user.fullName || 'No Name'}
          </h3>

          <p className="text-sm text-gray-500 mt-0.5">
            {user.email}
          </p>
        </div>

      </div>

      {/* Bottom Actions */}
      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">

        <span className="text-xs text-gray-400">
          Joined: {formattedDate}
        </span>

        <div className="flex gap-2">

          {/* EDIT */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            Edit
          </button>

          {/* DELETE */}
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user.id || user.uid);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              Delete
            </button>
          )}

        </div>
      </div>

    </div>
  );
};

export default UserCard;

