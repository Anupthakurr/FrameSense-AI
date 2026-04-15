import { useForm } from "react-hook-form";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddClientForm = ({ handleClick }) => {
  const navigate = useNavigate();
  const notify = () =>
    toast.success("Client added successfully", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

  const notifyError = (message) =>
    toast.error(message, {
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

  const [serverError, setServerError] = useState("");

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    const file = data.userAvatar && data.userAvatar[0];

    if (!file) {
      setServerError("Please select a profile image.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      notifyError("Only image files are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      notifyError("File size should not exceed 2MB.");
      return;
    }

    formData.append("userAvatar", file);

    try {
      const response = await axios.post(
        "/api/v1/profile/add-client",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      notify();
      reset();
    } catch (error) {
      navigate("/error");
      setServerError(error.response?.data || error.message);
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
                Profile Image:{" "}
              </p>
              <input
                type="file"
                {...register("userAvatar")}
                className="hover:cursor-pointer"
              />
            </div>
            <div
              onClick={() => handleClick()}
              className="absolute hidden sm:block right-1 hover:cursor-pointer"
            >
              <img src="back.svg" alt="cross" className="h-8 w-8" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[1.1rem] md:text-[1.3rem] font-bold">
              Client Name
            </label>
            <input
              name="name"
              id="name"
              {...register("name", {
                required: "Client name is required",
              })}
              className={`outline-none pl-3 rounded-lg h-[3.2rem] border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } hover:shadow-[0px_0px_5px_4px_#e9d8fd] duration-300 focus:border-pink-400 focus:shadow-[0px_0px_5px_4px_#e9d8fd]`}
            />
            {errors.name && (
              <span className="text-red-500 text-sm">
                {errors.name.message}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-[1.1rem] md:text-[1.3rem] font-bold"
            >
              Email
            </label>
            <input
              name="email"
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              className={`outline-none pl-3 rounded-lg h-[3.2rem] border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } hover:shadow-[0px_0px_5px_4px_#e9d8fd] duration-300 focus:border-pink-400 focus:shadow-[0px_0px_5px_4px_#e9d8fd]`}
            />
            {errors.email && (
              <span className="text-red-500 text-sm">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Serever error */}
          {serverError && (
            <div className="text-red-500 text-center">{serverError}</div>
          )}

          <div className="flex justify-center">
            <input
              type="submit"
              disabled={isSubmitting}
              className={`bg-gray-800 hover:bg-gray-900 w-full py-4 rounded-3xl text-white font-bold text-[0.9rem] ${
                isSubmitting
                  ? "opacity-50 hover:cursor-not-allowed"
                  : "hover:cursor-pointer"
              }`}
              value={isSubmitting ? "Adding..." : "Add Client"}
            />
          </div>
          <div className="sm:hidden flex justify-center -mt-4">
            <button
              onClick={() => handleClick()}
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

export default AddClientForm;
