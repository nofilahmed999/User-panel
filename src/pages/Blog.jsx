import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BlogModal from "../components/BlogModal";
import { auth, db } from "../firebase/config.js";
import { uploadImageToCloudinary } from "../cloudinary/cloudinary.js";
import { toast } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Blog() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal initial state FALSE hai taaki khud se Na khule
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const navigate = useNavigate();

  // Auth & Admin check
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
              fetchAllBlogs(); // Admin dekhega saare blogs
              return;
            }
          }
        } catch (err) {
          console.error("Role check error:", err);
        }
      } else {
        setCurrentUser(null);
      }

      setIsAdmin(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Admin View: Fetch All Blogs
  const fetchAllBlogs = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "blogs"));
      const fetchedBlogs = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      fetchedBlogs.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setBlogs(fetchedBlogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to load blogs!");
    } finally {
      setLoading(false);
    }
  };

  // Normal User: Create Blog Handler
  const handleCreateBlog = async (formData) => {
    if (!currentUser) {
      toast.error("Please login to create a blog!");
      return;
    }

    try {
      let authorName = currentUser.displayName || "Anonymous";
      let userPhoto = currentUser.photoURL || null;

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        authorName = userData.fullName || userData.displayName || authorName;
        userPhoto =
          userData.profilePic || userData.photoURL || userData.avatar || userPhoto;
      }

      let uploadedImageUrl = null;
      if (formData.file) {
        uploadedImageUrl = await uploadImageToCloudinary(formData.file);
        if (!uploadedImageUrl) {
          toast.error("Failed to upload image!");
          return;
        }
      }

      await addDoc(collection(db, "blogs"), {
        title: formData.title.trim(),
        content: formData.content.trim(),
        image: uploadedImageUrl,
        userId: currentUser.uid,
        authorName: authorName,
        userPhoto: userPhoto,
        createdAt: serverTimestamp(),
      });

      toast.success("Blog published successfully!");
      setIsModalOpen(false);
      navigate("/"); // Post create hone ke baad direct Home par navigate
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error("Failed to create blog!");
    }
  };

  // Admin View: Update Blog Handler
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
        authorName: formData.authorName || editingPost.authorName,
        content: formData.content,
        image: imageUrl,
        updatedAt: serverTimestamp(),
      });

      toast.success("Blog updated successfully!");
      setIsModalOpen(false);
      setEditingPost(null);
      fetchAllBlogs();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update blog!");
    }
  };

  // Admin View: Delete Blog Handler
  const handleDeleteBlog = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, "blogs", id));
        toast.success("Blog deleted successfully!");
        await fetchAllBlogs();
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("Failed to delete blog!");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return dateObj.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {isAdmin ? (
          /* ================= ADMIN VIEW: SAARE BLOGS ================= */
          <>
            <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Admin Blog Management
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Total Blogs:{" "}
                  <span className="font-semibold text-blue-600">
                    {blogs.length}
                  </span>
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-slate-500 text-sm">Loading all blogs...</p>
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">
                  No blogs published yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => {
                  const authorDP =
                    blog.userPhoto || blog.authorPic || blog.authorPhoto;

                  return (
                    <div
                      key={blog.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                    >
                      {/* Top Bar: User DP & Author Name */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {authorDP ? (
                            <img
                              src={authorDP}
                              alt="Author DP"
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                              {(blog.authorName || "U")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="truncate">
                            <p className="font-semibold text-slate-800 text-xs truncate">
                              {blog.authorName || "Anonymous"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatDateTime(blog.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons for Admin */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingPost(blog);
                              setIsModalOpen(true);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                            title="Edit Blog"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog.id)}
                            className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                            title="Delete Blog"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      {/* Post Image Display */}
                      {blog.image ? (
                        <div className="w-full h-44 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium italic">
                          No Image Attached
                        </div>
                      )}

                      {/* Title & Content */}
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                          {blog.title}
                        </h3>
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                          {blog.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ================= NORMAL USER VIEW ================= */
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-4 text-center min-h-[320px]">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-1">
              ✍️
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Create a New Blog Post
            </h2>
            <p className="text-slate-500 text-sm max-w-md">
              Share your thoughts, stories, and experiences with the community.
            </p>
            {/* Jab user CLICK KAREGA tab hi modal open hoga */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              Create Blog Post
            </button>
          </div>
        )}

        {/* Modal component */}
        <BlogModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={editingPost ? handleUpdateBlog : handleCreateBlog}
          editingPost={editingPost}
        />
      </div>

      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-800 font-semibold text-base">
              Deleting post...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}