import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function BlogModal({ isOpen, onClose, onSubmit, editingPost }) {
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 👈 Double click protection state

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setAuthorName(editingPost.authorName || "");
      setContent(editingPost.content || "");
      setPreviewUrl(editingPost.image || null);
      setSelectedFile(null);
    } else {
      setTitle("");
      setAuthorName("");
      setContent("");
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setIsSubmitting(false); // Modal khulne par state reset
  }, [editingPost, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔴 1. Agar request pehle se chal rahi hai toh DOBARA CLICK WORK NAHI KAREGA
    if (isSubmitting) return;

    // 🔴 2. Field Validations
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

    // 🔴 3. Lock Button Immediately
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
      setIsSubmitting(false); // Error aane par hi button reset hoga
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {editingPost ? "Edit Blog Post" : "Create New Blog"}
          </h2>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1 rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Enter post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Author Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              disabled={isSubmitting}
              placeholder="Write blog description..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Image File <span className="text-red-500">* (Necessary)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={isSubmitting}
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-2 h-24 rounded-lg object-cover border"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            
            {/* 🔴 DISABLED ON CLICK WITH LOADING TEXT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Uploading...
                </>
              ) : editingPost ? (
                "Update Post"
              ) : (
                "Publish"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}