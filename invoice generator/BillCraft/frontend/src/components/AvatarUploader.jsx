import { useForm } from "react-hook-form";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AvatarUploader = ({handleClick}) => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const notifySuccess = () => toast.success("Avatar added successfully!", {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });

  const notifyError = (message) => toast.error(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const formData = new FormData();
    const file = data.userAvatar && data.userAvatar[0];
    
    if (!file) {
      setServerError("Please select a profile image.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      notifyError("Only image files are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      notifyError("File size should not exceed 2MB.");
      return;
    }

    formData.append("userAvatar", file);

    try {
      const response = await axios.post("/api/v1/userAvatar/addAvatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      notifySuccess();
      reset();
      setTimeout(() => handleClick(), 2200);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Upload failed. Please try again.";
      notifyError(errorMsg);
      setServerError(errorMsg);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="w-full flex justify-center items-center min-h-screen">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col w-2/3 sm:w-3/4 md:w-1/2 gap-8 p-4 sm:p-8 lg:p-10 border-2 border-black rounded-3xl"
        >
          <div className="relative flex items-center">
            <div className="flex flex-col lg:flex lg:flex-row gap-2">
              <p className="text-[1.1rem] md:text-[1.3rem] font-bold">
                Profile Image:
              </p>
              <input
                type="file"
                accept="image/*"
                {...register("userAvatar")}
                className="hover:cursor-pointer"
              />
            </div>
            <div
              onClick={handleClick}
              className="absolute hidden sm:block right-1 hover:cursor-pointer"
            >
              <img src="back.svg" alt="Back" className="h-8 w-8" />
            </div>
          </div>

          {serverError && (
            <div className="text-red-500 text-center">{serverError}</div>
          )}

          <div className="flex justify-center">
            <input
              type="submit"
              disabled={isSubmitting}
              className={`bg-gray-800 hover:bg-gray-900 w-full py-4 rounded-3xl text-white font-bold text-[0.9rem] ${
                isSubmitting ? "opacity-50 hover:cursor-not-allowed" : "hover:cursor-pointer"
              }`}
              value={isSubmitting ? "Adding..." : "Add Avatar"}
            />
          </div>
          <div className="sm:hidden flex justify-center -mt-4">
            <button
              onClick={handleClick}
              className="bg-gray-800 hover:bg-gray-900 py-4 w-full rounded-3xl text-white font-bold text-[0.9rem]"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AvatarUploader;
