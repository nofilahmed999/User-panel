import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config.js";
import { toast } from "react-toastify";
import GoogleAuthButton from "../components/GoogleAuthButton";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const LoginHandler = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      toast.success("Login successful!", {
        position: "top-right",
        autoClose: 2000,
      });

      navigate("/");
    } catch (error) {
      console.error("Login Error:", error.message);
      toast.error(error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
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
              Welcome <br /> back.
            </h1>
            <p className="mt-4 text-sm lg:text-base text-blue-100 leading-6">
              Sign in to your account to continue where you left off.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-5 sm:p-7 overflow-y-auto flex flex-col justify-center">
          <div className="mb-5">
            <p className="text-xs font-bold tracking-widest text-blue-600">
              WELCOME BACK
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Log in
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your details to access your account.
            </p>
          </div>

          <form onSubmit={LoginHandler} className="space-y-4">
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
                placeholder="Enter your password"
                required
                className="w-full px-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 outline-none text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white text-sm font-semibold transition shadow-md ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-200"
              }`}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          {/* Divider & Google Auth Button */}
          <div className="my-4 flex items-center justify-between">
            <span className="w-1/5 border-b border-gray-200 lg:w-1/4"></span>
            <span className="text-xs text-center text-gray-500 uppercase">or</span>
            <span className="w-1/5 border-b border-gray-200 lg:w-1/4"></span>
          </div>

          <GoogleAuthButton title="login with google" isLoginMode={false}/>

          <p className="text-center text-xs text-gray-500 mt-5">
            Don't have an account?
            <Link
              to="/signup"
              className="text-blue-600 font-semibold ml-1 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;