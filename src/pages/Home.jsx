import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import EditUserModal from "../components/EditUserModal";
import UserCard from "../components/UserCard.jsx";
import heros from "../assets/heros.jpg";
import { useLocation } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';

import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase/config.js';
import { toast } from 'react-toastify';

import {
  Users,
  ShieldCheck,
  UserCheck,
  Mail,
  MessageSquare,
  Send,
  User,
  Search,
  Activity,
  ArrowRight
} from 'lucide-react';

function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  // =========================
  // CONTACT FORM STATE
  // =========================
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // =========================
  // AUTH & ADMIN STATE
  // =========================
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // =========================
  // FIRESTORE USERS STATE
  // =========================
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // =========================
  // AUTH + FIRESTORE
  // =========================
  useEffect(() => {

    let unsubscribeFirestore = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {

      if (user) {

        setCurrentUser(user);

        try {

          // Current user document
          const userDocRef = doc(db, 'users', user.uid);

          const userDocSnap = await getDoc(userDocRef);

          const userIsAdmin =
            userDocSnap.exists() &&
            userDocSnap.data().role === 'admin';

          setIsAdmin(userIsAdmin);

          // =========================
          // ADMIN
          // =========================
          if (userIsAdmin) {

            unsubscribeFirestore = onSnapshot(
              collection(db, 'users'),

              (snapshot) => {

                const userList = snapshot.docs.map((docSnap) => ({
                  id: docSnap.id,
                  ...docSnap.data(),
                }));

                setUsers(userList);
                setUsersLoading(false);
              },

              (error) => {

                console.error(
                  "Firestore read error:",
                  error
                );

                toast.error(
                  "Failed to load users from Firebase."
                );

                setUsersLoading(false);
              }
            );

          }

          // =========================
          // NORMAL USER
          // =========================
          else {

            unsubscribeFirestore = onSnapshot(
              userDocRef,

              (docSnap) => {

                if (docSnap.exists()) {

                  setUsers([
                    {
                      id: docSnap.id,
                      ...docSnap.data()
                    }
                  ]);

                } else {

                  setUsers([]);

                }

                setUsersLoading(false);
              },

              (error) => {

                console.error(
                  "Firestore read error:",
                  error
                );

                toast.error(
                  "Failed to load profile."
                );

                setUsersLoading(false);
              }
            );
          }

        } catch (error) {

          console.error(
            "Error verifying user role:",
            error
          );

          setUsersLoading(false);
        }

      } else {

        setCurrentUser(null);
        setIsAdmin(false);
        setUsers([]);
        setUsersLoading(false);
      }
    });

    return () => {

      unsubscribeAuth();
      unsubscribeFirestore();

    };

  }, []);

  // =========================
  // DELETE USER
  // =========================
  const handleDeleteUser = async (userId) => {

    // Only admin can delete
    if (!isAdmin) {

      toast.error(
        "Unauthorized: Only administrators can delete users."
      );

      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user from Firebase?"
    );

    if (!confirmDelete) return;

    try {

      await deleteDoc(
        doc(db, 'users', userId)
      );

      toast.success(
        "User deleted successfully!"
      );

    } catch (error) {

      console.error(
        "Delete error:",
        error
      );

      toast.error(
        "Failed to delete user."
      );
    }
  };

  // =========================
  // EDIT USER
  // =========================
  const handleEditUser = (user) => {

    setSelectedUser(user);
    setIsModalOpen(true);

  };

  // =========================
  // SIMPLE CONTACT FORM
  // =========================
  const handleFormSubmit = (e) => {

    e.preventDefault();

    // No Firebase / Firestore here
    toast.success(
      'Thank you! Your message has been sent.'
    );

    // Clear form
    setFormData({
      name: '',
      email: '',
      message: ''
    });
  };

  // =========================
  // SEARCH USERS
  // =========================
  const filteredUsers = users.filter((u) =>
    u.fullName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase()) ||

    u.email
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (

    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">

      <Navbar />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

        {/* =========================
            USER HERO SECTION
        ========================= */}
        {!isAdmin && (

          <section
   id="hero"
  className="rounded-3xl p-8 sm:p-12 text-white shadow-lg relative overflow-hidden bg-cover bg-center"
  style={{ backgroundImage: `url(${heros})` }}
>
  
  {/* Blue overlay */}
  <div className="absolute inset-0 bg-black/30"></div>


            <div className="relative  z-10 max-w-2xl space-y-4">

              <span className="inline-block px-3 py-1 bg-blue-700 text-blue-100 rounded-full text-xs font-semibold uppercase tracking-[1px]">
                User Portal
              </span>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Welcome back to your workspace!
              </h1>

              <p className="text-blue-100 text-base sm:text-lg">
                Manage your account settings, view active subscription stats, or submit support tickets directly to administrators.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">

                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
                >
                  Contact Support
                  <ArrowRight size={16} />
                </a>

                <a
                  href="#users"
                  className="inline-flex items-center gap-2 bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors"
                >
                  View Profile
                </a>

              </div>

            </div>

          </section>

        )}

        {/* =========================
            DASHBOARD HEADER
        ========================= */}
        <div className="bg-white cursor-pointer border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Dashboard Overview
              </h1>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isAdmin
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {isAdmin ? 'Admin Mode' : 'User Mode'}
              </span>

            </div>

            <p className="text-slate-500 text-sm mt-1">

              {isAdmin
                ? "Manage system accounts, profiles, and database privileges."
                : "View and manage your personal account details."
              }

            </p>

          </div>

          <div className="flex  items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">

            <Activity
              size={15}
              className="text-emerald-600 animate-pulse"
            />

            <span className="font-medium">
              Live Sync Active
            </span>

          </div>

        </div>

        {/* =========================
            METRICS CARDS
        ========================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* TOTAL RECORDS */}
          <div className="bg-white cursor-pointer  border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between  transition-colors">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Records
              </p>

              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {users.length}
              </p>

            </div>

            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">

              <Users size={24} />

            </div>

          </div>

          {/* CURRENT ROLE */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer  transition-colors">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Role
              </p>

              <p className="text-xl font-bold text-slate-900 mt-1 capitalize">
                {isAdmin
                  ? 'Administrator'
                  : 'Standard User'
                }
              </p>

            </div>

            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">

              <ShieldCheck size={24} />

            </div>

          </div>

          {/* ACTIVE USER */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1 cursor-pointer  transition-colors">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active User
              </p>

              <p className="text-sm font-semibold text-slate-900 mt-1 truncate max-w-[200px]">
                {currentUser?.email || 'N/A'}
              </p>

            </div>

            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">

              <UserCheck size={24} />

            </div>

          </div>

        </div>

        {/* =========================
            USER DIRECTORY
        ========================= */}
        <section
          id="users"
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
        >

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

            <div>

              <h2 className="text-xl font-bold text-slate-900">

                {isAdmin
                  ? "User Management Directory"
                  : "Your Profile Record"
                }

              </h2>

              <p className="text-xs text-slate-500 mt-0.5">

                {isAdmin
                  ? "Real-time list of registered platform accounts."
                  : "Your individual registered account info."
                }

              </p>

            </div>

            {/* SEARCH - ADMIN ONLY */}
            {isAdmin && (

              <div className="relative w-full sm:w-64">

                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />

                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            )}

          </div>

          {/* LOADING */}
          {usersLoading ? (

            <div className="text-center py-12">

              <p className="text-slate-500 text-sm animate-pulse">
                Fetching database records...
              </p>

            </div>

          ) : filteredUsers.length === 0 ? (

            /* NO USERS */
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">

              <p className="text-slate-500 text-sm">
                No accounts found.
              </p>

            </div>

          ) : (

            /* USERS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {filteredUsers.map((user) => (

                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  isAdmin={isAdmin}
                />

              ))}

            </div>

          )}

        </section>

        {/* =========================
            SIMPLE CONTACT FORM
            REGULAR USERS ONLY
        ========================= */}
        {!isAdmin && (

          <section
            id="contact"
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl mx-auto"
          >

            <div className="mb-6">

              <h2 className="text-xl font-bold text-slate-900">
                Support & Inquiries
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Send a direct message to the administration team.
              </p>

            </div>

            <form
              onSubmit={handleFormSubmit}
              className="space-y-4"
            >

              {/* NAME + EMAIL */}
              <div className="grid sm:grid-cols-2 gap-4">

                {/* NAME */}
                <div>

                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                    Full Name
                  </label>

                  <div className="relative">

                    <input
                      type="text"
                      required
                      placeholder="Enter name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value
                        })
                      }
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />

                    <User
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                </div>

                {/* EMAIL */}
                <div>

                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                    Email Address
                  </label>

                  <div className="relative">

                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value
                        })
                      }
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />

                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                </div>

              </div>

              {/* MESSAGE */}
              <div>

                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Message
                </label>

                <div className="relative">

                  <textarea
                    rows={3}
                    required
                    placeholder="How can we help?"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        message: e.target.value
                      })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
                  />

                  <MessageSquare
                    size={15}
                    className="absolute left-3 top-3.5 text-slate-400"
                  />

                </div>

              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors active:scale-[0.99]"
              >

                <span>
                  Submit Message
                </span>

                <Send size={14} />

              </button>

            </form>

          </section>

        )}

      </main>

      {/* =========================
          FOOTER
      ========================= */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">

        <p>
          &copy; 2026 MyApp Control Panel. All rights reserved.
        </p>

      </footer>

      {/* =========================
          EDIT USER MODAL
      ========================= */}
      <EditUserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
}

export default Home;