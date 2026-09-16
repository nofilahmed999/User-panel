import axios from "axios";

export const uploadImageToCloudinary = async (file) => {
  try {
    const formData = new FormData();

    formData.append("file", file);

    // Using environment variables for security
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "user_profile"
    );

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );

    return response.data.secure_url;
  } catch (error) {
    console.log("Error in cloudinary file -->", error);
    return null;
  }
};