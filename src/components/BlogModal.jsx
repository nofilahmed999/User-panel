import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {auth} from "../firebase/config.js"

export default function BlogModal({ isOpen, onClose, onSubmit, editingPost }) {
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
useEffect(() => {
  if (editingPost) {
    setTitle(editingPost.title || "");
    setAuthorName(editingPost.authorName || "");
    setContent(editingPost.content || "");
    setPreviewUrl(editingPost.image || null);
    setSelectedFile(null);
  } else {
    setTitle("");
    // Logged-in user ka name default aayega (agar user type/erase karega toh hat jayega)
    const user = auth.currentUser;
    setAuthorName(user?.displayName || "");
    setContent("");
    setSelectedFile(null);
    setPreviewUrl(null);
  }
}, [editingPost, isOpen]);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!title.trim()) {
      toast.error("Please fill title field!");
      return;
    }

    if (!authorName.trim()) {
      toast.error("Please fill author name!");
      return;
    }

    if (!content.trim()) {
      toast.error("Please fill content field!");
      return;
    }

    if (!selectedFile && !editingPost?.image) {
      toast.error("Image file is necessary! Please upload an image.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        authorName,
        content,
        file: selectedFile,
        existingImage: editingPost ? editingPost.image : null,
      });
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Container: White border removed & max-height controlled */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header - Compact Height */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {editingPost ? "Edit Blog Post" : "Create New Blog"}
            </h2>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Form Body - Reduced Spacing & Height */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          
          {/* Title Field */}
          <div>
             <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
               Author Name<span className="text-red-500">*</span>
            </label>
             <input
              type="text"
              disabled={isSubmitting}
              placeholder="Your name..."
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:bg-slate-100 text-slate-800 font-medium"
            />
           
          
          </div>

          {/* Author Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Blog Title <span className="text-red-500">*</span>
            </label>
              <input
              type="text"
              disabled={isSubmitting}
              placeholder="Enter post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:bg-slate-100 text-slate-800 font-medium"
            />
           
          </div>

          {/* Content Field - Reduced Rows */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              disabled={isSubmitting}
              placeholder="Write your story here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:bg-slate-100 text-slate-800 font-normal leading-relaxed"
            ></textarea>
          </div>

          {/* Cover Image Upload Area - Compact Height */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Cover Image <span className="text-red-500">*</span>
            </label>
            
            {!previewUrl ? (
              <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-xl py-3 px-4 flex items-center justify-center gap-3 cursor-pointer transition-all group">
                <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                    Click to upload image
                  </p>
                  <p className="text-[10px] text-slate-400">
                    PNG, JPG or WebP (Max 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isSubmitting}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative w-full h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1.5 right-1.5 bg-slate-900/70 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors backdrop-blur-sm"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons - Compact Padding */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm active:scale-95 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Publishing...
                </>
              ) : editingPost ? (
                "Update Post ✏️"
              ) : (
                "Publish Post 🚀"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}