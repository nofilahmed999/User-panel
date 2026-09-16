import React, { useState } from "react";
import GoogleIcon from "@mui/icons-material/Google";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const GoogleAuthButton = ({ title = "Continue with Google", isSignupMode = false }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    if (loading) return;

    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      // 1. BLOCK LOGIN IF NO ACCOUNT EXISTS
      if (!isSignupMode && !userDoc.exists()) {
        toast.error("No account found! Please sign up first.");
        setLoading(false);
        return;
      }

      // 2. NEW USER SIGNUP: Create record and redirect to onboarding / setup page
      if (isSignupMode && !userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          fullName: user.displayName || "Google User",
          email: user.email,
          profileImg: user.photoURL || "",
          role: "user",
          createdAt: serverTimestamp(),
        });

        toast.success("User Signup Successfuly.");
        toast.success("Login Please.");
        
        // Redirect new signups to a profile completion or login route instead of home
        navigate("/login"); // Or navigate("/login")
        return;
      }

      // 3. EXISTING USER LOGIN: Redirect directly to dashboard
      toast.success("Logged in successfully!");
      navigate("/");
    } catch (error) {
      console.error("Google Auth Error:", error.message);
      toast.error(error.message || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`w-full py-3 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-sm flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition shadow-sm ${
        loading ? "opacity-70 cursor-not-allowed" : ""
      }`}
    >
      <GoogleIcon className="text-blue-600" style={{ fontSize: 20 }} />
      <span>{loading ? "Connecting..." : title}</span>
    </button>
  );
};

export default GoogleAuthButton;