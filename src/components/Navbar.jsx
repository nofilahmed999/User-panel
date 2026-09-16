import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Role check error in Navbar:", error);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-700 border-b border-blue-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/home"
          className="text-xl font-bold text-white tracking-tight"
        >
          My App
        </Link>

        {/* ================= DESKTOP LINKS ================= */}
        <div className="hidden md:flex items-center gap-8 text-base font-medium text-gray-100">
          {!isAdmin && (
            <>
              {/* Route + Hash ID setup for sections in Home.jsx */}
              <Link to="/home#hero" className="hover:text-white transition-colors">
                Home
              </Link>

              <Link to="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>

              <Link to="/home#contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link
                to="/home#users"
                className="text-white font-bold underline underline-offset-4 decoration-white"
              >
                Users Directory
              </Link>

              {/* 🔴 ADMIN BLOG LINK ADDED */}
              <Link
                to="/blog"
                className="hover:text-white transition-colors"
              >
                Blog
              </Link>
            </>
          )}
        </div>

        {/* ================= DESKTOP AUTH ================= */}
        <div className="hidden md:flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-100">
                {currentUser.email}
              </span>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-white text-black hover:text-blue-600 text-sm font-bold"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 rounded-lg bg-white text-blue-600 hover:bg-blue-50 text-sm font-bold transition-colors shadow-sm"
            >
              Login
            </Link>
          )}
        </div>

        {/* ================= MOBILE TOGGLE ================= */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-white p-2"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={`md:hidden bg-blue-600 border-b border-blue-700 px-6
        space-y-3 text-base font-medium text-white shadow-lg
        overflow-hidden transition-all duration-300 ease-in-out
        ${
          isMobileMenuOpen
            ? "max-h-[500px] opacity-100 py-4"
            : "max-h-0 opacity-0 py-0"
        }`}
      >
        {/* Normal User Links */}
        {!isAdmin && (
          <>
            <Link
              to="/home#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2"
            >
              Home
            </Link>

            <Link
              to="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2"
            >
              Blog
            </Link>

            <Link
              to="/home#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2"
            >
              Contact
            </Link>
          </>
        )}

        {/* Admin Links */}
        {isAdmin && (
          <>
            <Link
              to="/home#users"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 font-bold underline"
            >
              Users Directory
            </Link>

            {/* 🔴 MOBILE ADMIN BLOG LINK ADDED */}
            <Link
              to="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2"
            >
              Blog
            </Link>
          </>
        )}

        {/* Mobile Auth */}
        <div className="pt-3 border-t border-blue-500/50 flex flex-col gap-3">
          {currentUser ? (
            <>
              <span className="text-sm text-blue-100 truncate">
                {currentUser.email}
              </span>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-sm font-semibold text-white text-center"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-lg bg-white text-blue-600 text-sm font-bold text-center block"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;