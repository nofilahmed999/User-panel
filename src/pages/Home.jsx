import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import BlogModal from "../components/BlogModal";
import { auth, db } from "../firebase/config.js";
import { uploadImageToCloudinary } from "../cloudinary/cloudinary.js";
import { toast } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".menu-container")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = (userData.role || "").toLowerCase();

            if (role === "admin" || role === "administrator") {
              setIsAdmin(true);
              fetchUsers();
              return;
            }
          }
        } catch (err) {
          console.error("User Fetch Error:", err);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAdmin(false);
      fetchPosts();
    });

    return () => unsubscribe();
  }, []);

  // Fetch Users without Admin accounts
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const fetchedUsers = querySnapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter((user) => {
          const userRole = (user.role || "").toLowerCase();
          return userRole !== "admin" && userRole !== "administrator";
        });

      setUsersList(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users list!");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "blogs"));
      const fetchedPosts = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      fetchedPosts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPosts(fetchedPosts);
    } catch (error) {
      toast.error("Failed to load home feed!");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async (formData) => {
    if (!currentUser || !editingPost) return;

    let imageUrl = formData.existingImage || null;
    if (formData.file) {
      imageUrl = await uploadImageToCloudinary(formData.file);
      if (!imageUrl) {
        toast.error("Image upload failed!");
        return;
      }
    }

    try {
      await updateDoc(doc(db, "blogs", editingPost.id), {
        title: formData.title,
        authorName: formData.authorName,
        content: formData.content,
        image: imageUrl,
        updatedAt: serverTimestamp(),
      });

      toast.success("Post updated!");
      setIsModalOpen(false);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      toast.error("Failed to update post!");
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, "blogs", id));
        toast.success("Post deleted!");
        await fetchPosts();
      } catch (err) {
        toast.error("Failed to delete post!");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return dateObj.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isAdmin ? "Admin User Dashboard" : "Home Feed"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isAdmin
                ? `Total Registered Users: ${usersList.length}`
                : "Explore articles created by all users."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        ) : isAdmin ? (
          /* ADMIN VIEW: USER CARDS WITH SIGNUP DP */
          usersList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium">No users found in database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {usersList.map((user) => {
                // Check Signup form profile picture field from Firestore
                const userDP = user.profilePic || user.photoURL || user.avatar || user.image;

                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {userDP ? (
                        <img
                          src={userDP}
                          alt={user.fullName || "User DP"}
                          className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center text-blue-700 font-bold text-lg">
                          {(user.fullName || user.displayName || user.email || "U")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-900 text-base truncate">
                          {user.fullName || user.displayName || "No Name"}
                        </h3>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 bg-slate-100 text-slate-700">
                          Role: {user.role || "User"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-400">Email:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                          {user.email || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-400">User ID:</span>
                        <span className="font-mono text-slate-700 truncate max-w-[150px]">
                          {user.id}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-400">Joined:</span>
                        <span>{formatDateTime(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">No blog posts available right now.</p>
          </div>
        ) : (
          /* USER VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => {
              const isOwner = currentUser && String(post.userId) === String(currentUser.uid);

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      {post.userPhoto ? (
                        <img
                          src={post.userPhoto}
                          alt="author"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {post.authorName ? post.authorName.slice(0, 2) : "U"}
                        </div>
                      )}
                      <span className="font-semibold text-slate-800 text-sm capitalize">
                        {post.authorName || "Anonymous"}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500">{formatDateTime(post.createdAt)}</span>
                  </div>

                  {post.image && (
                    <div className="w-full flex justify-center items-center bg-slate-50 rounded-xl p-2 min-h-[180px]">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="max-h-72 w-full object-contain rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mt-1">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{post.title}</h3>

                    {isOwner && (
                      <div className="relative menu-container">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === post.id ? null : post.id)
                          }
                          className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {activeMenuId === post.id && (
                          <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setEditingPost(post);
                                setIsModalOpen(true);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleDeletePost(post.id);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <BlogModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPost(null);
          }}
          onSubmit={handleUpdateBlog}
          editingPost={editingPost}
        />
      </div>

      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-800 font-semibold text-base">Deleting post...</p>
          </div>
        </div>
      )}
    </div>
  );
}