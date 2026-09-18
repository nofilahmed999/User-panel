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

export default function UserProfile() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let unsubscribeFirestore = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          const userIsAdmin = userDocSnap.exists() && userDocSnap.data().role === 'admin';
          setIsAdmin(userIsAdmin);

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
                console.error("Firestore read error:", error);
                toast.error("Failed to load users from Firebase.");
                setUsersLoading(false);
              }
            );
          } else {
            unsubscribeFirestore = onSnapshot(
              userDocRef,
              (docSnap) => {
                if (docSnap.exists()) {
                  setUsers([{ id: docSnap.id, ...docSnap.data() }]);
                } else {
                  setUsers([]);
                }
                setUsersLoading(false);
              },
              (error) => {
                console.error("Firestore read error:", error);
                toast.error("Failed to load profile.");
                setUsersLoading(false);
              }
            );
          }
        } catch (error) {
          console.error("Error verifying user role:", error);
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

  const handleDeleteUser = async (userId) => {
    if (!isAdmin) {
      toast.error("Unauthorized: Only administrators can delete users.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user from Firebase?")) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete user.");
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    toast.success('Thank you! Your message has been sent.');
    setFormData({ name: '', email: '', message: '' });
  };

  const filteredUsers = users.filter((u) =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <Navbar />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* HERO SECTION */}
       



        {/* USER CARD / DIRECTORY */}
        <section id="users" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{isAdmin ? "User Management Directory" : "Your Profile Record"}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{isAdmin ? "Real-time list of registered platform accounts." : "Your individual registered account info."}</p>
            </div>

            {isAdmin && (
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </div>

          {usersLoading ? (
            <div className="text-center py-12"><p className="text-slate-500 text-sm animate-pulse">Fetching database records...</p></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200"><p className="text-slate-500 text-sm">No accounts found.</p></div>
          ) : (
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

      </main>


      <EditUserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}