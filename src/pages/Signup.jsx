import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config.js";
import { toast } from "react-toastify";
import { uploadImageToCloudinary } from "../cloudinary/cloudinary.js";
import GoogleAuthButton from "../components/GoogleAuthButton";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImg, setProfileImg] = useState(null);
  
  // 1. Loading state add ki double clicks prevent karne ke liye
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const SignupHandler = async (e) => {
    e.preventDefault();

    // Double-click guard
    if (loading) return;

    // Validation
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!profileImg) {
      toast.error("Please select a profile image.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true); // Lock execution

    try {
      // 1. Upload Image First
      const imageUrl = await uploadImageToCloudinary(profileImg);

      // 2. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 3. Update Auth Profile Display Name & Photo
      await updateProfile(user, {
        displayName: fullName,
        photoURL: imageUrl,
      });

      // 4. Save User Details to Firestore Database using user.uid (Prevents Duplicates)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: email,
        profileImg: imageUrl,
        role: "user",
        createdAt: serverTimestamp(),
      });

      toast.success("Signup successful! Please login.", {
        position: "top-right",
        autoClose: 2000,
      });

      navigate("/login");
    } catch (error) {
      console.error("Signup Error:", error.message);
      toast.error(error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false); // Unlock execution
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-blue-50 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-3xl h-[95vh] sm:h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden md:flex bg-blue-600 text-white p-7 lg:p-9 flex-col justify-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-white/10"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
              N
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mt-7 leading-tight">
              Create your <br /> account.
            </h1>
            <p className="mt-4 text-sm lg:text-base text-blue-100 leading-6">
              Join us today and create your account to access all features.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-5 sm:p-7 overflow-y-auto">
          <div className="mb-5">
            <p className="text-xs font-bold tracking-widest text-blue-600">
              GET STARTED
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Sign up
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Create your account below.
            </p>
          </div>

          <form onSubmit={SignupHandler} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 outline-none text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 outline-none text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="6"
                placeholder="Create a password"
                required
                className="w-full px-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 outline-none text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label
                htmlFor="file"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Profile Image
              </label>
              <input
                id="file"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setProfileImg(e.target.files[0])}
                className="w-full px-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 outline-none text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {profileImg && (
              <button
                type="button"
                onClick={() => {
                  setProfileImg(null);
                  document.getElementById("file").value = "";
                }}
                className="mt-1 text-sm text-red-500 hover:text-red-600 font-medium"
              >
                ✕ Remove selected image
              </button>
            )}

            {/* 2. Button is disabled when loading is true */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white text-sm font-semibold transition shadow-md ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-200"
              }`}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider & Google Auth Button */}
          <div className="my-4 flex items-center justify-between">
            <span className="w-1/5 border-b border-gray-200 lg:w-1/4"></span>
            <span className="text-xs text-center text-gray-500 uppercase">or</span>
            <span className="w-1/5 border-b border-gray-200 lg:w-1/4"></span>
          </div>

          <GoogleAuthButton title="Sign up with Google" isSignupMode={true} />

          <p className="text-center text-xs text-gray-500 mt-5">
            Already have an account?
            <Link
              to="/login"
              className="text-blue-600 font-semibold ml-1 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;