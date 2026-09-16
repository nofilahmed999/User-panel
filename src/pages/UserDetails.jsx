import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({
            id: userSnap.id,
            ...userSnap.data(),
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className=" min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl  font-bold">User not found</h1>

        <button
          onClick={() => navigate("/admin")}
          className="mt-4 px-5 py-2  bg-blue-600 text-white rounded-lg"
        >
          Back
        </button>
      </div>
    );
  }

  const imageUrl = user.photoURL || user.profileImg;

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        ← Back
      </button>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <div className="flex flex-col items-center">

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={user.fullName}
              className="cursor-pointer w-32 h-32 rounded-full object-cover border-4 border-blue-100"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
              {user.fullName?.[0]?.toUpperCase() || "U"}
            </div>
          )}

          <h1 className="mt-5 text-3xl font-bold text-gray-800">
            {user.fullName || "No Name"}
          </h1>

          <p className="text-gray-500">
            {user.email}
          </p>

        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-gray-400">Full Name</p>
            <p className="font-semibold">
              {user.fullName || "N/A"}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-gray-400">Email</p>
            <p className="font-semibold">
              {user.email || "N/A"}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-gray-400">Role</p>
            <p className="font-semibold capitalize">
              {user.role || "user"}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-gray-400">User ID</p>
            <p className="font-semibold break-all">
              {user.id}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserDetails;