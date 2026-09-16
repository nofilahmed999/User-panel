import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import BlogModal from "../components/BlogModal";
import { auth, db } from "../firebase/config.js";
import { uploadImageToCloudinary } from "../cloudinary/cloudinary.js";
import { toast } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

export default function Blog() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // 🔴 Loading Popup State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Outside click menu handler
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".menu-container")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // 1. Fetch User Role & Auth Status
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
            } else {
              setIsAdmin(false);
            }
          }
        } catch (err) {
          console.error("User Role Fetch Error:", err);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Blogs Logic
  const fetchPosts = async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      let blogsQuery;

      if (isAdmin) {
        blogsQuery = collection(db, "blogs");
      } else {
        blogsQuery = query(
          collection(db, "blogs"),
          where("userId", "==", currentUser.uid)
        );
      }

      const querySnapshot = await getDocs(blogsQuery);
      const fetchedPosts = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      fetchedPosts.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to load blogs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser, isAdmin]);

  // 3. Save / Update Logic
  const handleSaveBlog = async (formData) => {
    if (!currentUser) {
      toast.error("Please login to create a blog post!");
      return;
    }

    let imageUrl = formData.existingImage || null;

    if (formData.file) {
      imageUrl = await uploadImageToCloudinary(formData.file);
      if (!imageUrl) {
        toast.error("Image upload to Cloudinary failed!");
        return;
      }
    }

    const payload = {
      title: formData.title,
      authorName: formData.authorName,
      content: formData.content,
      image: imageUrl,
    };

    try {
      if (editingPost) {
        await updateDoc(doc(db, "blogs", editingPost.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast.success("Post updated!");
      } else {
        await addDoc(collection(db, "blogs"), {
          ...payload,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
        toast.success("Post published!");
      }

      setIsModalOpen(false);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error("Save Blog Error:", err);
      toast.error("Save failed: " + err.message);
    }
  };

  // 4. Delete Handler with Loading Popup
  const handleDeletePost = async (id) => {
    if (window.confirm("Delete this blog post permanently?")) {
      setIsDeleting(true); // 🔴 Show center popup
      try {
        await deleteDoc(doc(db, "blogs", id));
        toast.success("Post deleted!");
        await fetchPosts();
      } catch (err) {
        console.error("Delete Error:", err);
        toast.error("Failed to delete!");
      } finally {
        setIsDeleting(false); // 🔴 Hide popup
      }
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return dateObj.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Blog Posts</h1>
            <p className="text-slate-500 text-sm mt-1">
              Community blog entries and updates.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingPost(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
          >
            + Create Blog
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-slate-500 text-sm">Loading blogs from database...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">No blog posts found.</p>
            <p className="text-slate-400 text-xs mt-1">
              Click on "+ Create Blog" to write your first post.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const isOwner = currentUser && String(post.userId) === String(currentUser.uid);
              const canModify = isAdmin || isOwner;

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {post.image && (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-48 w-full object-cover"
                      />
                    )}
                    <div className="p-5">
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                        <span className="font-semibold text-blue-600 uppercase">
                          By {post.authorName || "Anonymous"}
                        </span>

                        <div className="flex items-center gap-2">
                          <span>{formatDateTime(post.createdAt)}</span>

                          {canModify && (
                            <div className="relative menu-container">
                              <button
                                onClick={() =>
                                  setActiveMenuId(activeMenuId === post.id ? null : post.id)
                                }
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
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
                                    className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleDeletePost(post.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                        {post.content}
                      </p>
                    </div>
                  </div>
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
          onSubmit={handleSaveBlog}
          editingPost={editingPost}
        />
      </div>

      {/* 🔴 CENTER POPUP FOR DELETING POST */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-800 font-semibold text-base">
              Post deleting...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}