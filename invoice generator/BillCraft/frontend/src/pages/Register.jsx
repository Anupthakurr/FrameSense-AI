import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      const response = await axios.post("/api/v1/user/register", data);
      alert(response.data.message);
      navigate("/signin");
    } catch (error) {
      setServerError(error.response?.data?.error || "Registration failed");
    }
  };

  return (
    <>
      <div className="relative h-screen flex justify-center items-center lg:flex">
        <div className="lg:hidden absolute h-[2rem] w-[10rem] top-8 left-8 flex items-center gap-1">
          <h1 className="font-dancing-script text-black text-3xl font-bold">
            SmartInvoice
          </h1>
          <img src="/invoice.svg" alt="invlice-icon" className="h-full" />
        </div>
        <div className="relative hidden lg:block w-1/2 h-full bg-black">
          <div className="absolute h-[2rem] w-[10rem] top-8 left-8 flex items-center gap-1">
            <h1 className="font-great-vibes-regular text-white text-3xl font-bold">
              SmartInvoice
            </h1>
            <img src="/invoice.svg" alt="invlice-icon" className="h-full" />
          </div>
          <img
            src="/macbook.jpg"
            alt="macbook_pic"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex justify-center items-center w-1/2 h-full">
          <div className="flex flex-col gap-[4rem]">
            <h1 className="text-2xl sm:text-3xl font-bold text-left">
              Create Your Account
            </h1>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <div className="flex gap-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="fullname" className="text-[1rem] font-bold">
                    Name
                  </label>
                  <input
                    name="fullname"
                    id="fullname"
                    {...register("fullname", {
                      required: "Full name is required",
                    })}
                    className={`outline-none pl-3 rounded-lg h-[3.2rem] w-40 sm:w-52 md:w-72 lg:w-52 border ${
                      errors.fullname ? "border-red-500" : "border-gray-300"
                    } hover:shadow-[0px_0px_5px_4px_#e9d8fd] duration-300 focus:border-pink-400 focus:shadow-[0px_0px_5px_4px_#e9d8fd]`}
                  />
                  {errors.fullname && (
                    <span className="text-red-500 text-sm">
                      {errors.fullname.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="username" className="text-[1rem] font-bold">
                    Username
                  </label>
                  <input
                    name="username"
                    id="username"
                    {...register("username", {
                      required: "Username is required",
                      minLength: {
                        value: 4,
                        message: "At least 4 characters",
                      },
                    })}
                    className={`outline-none pl-3 rounded-lg h-[3.2rem] w-40 sm:w-52 md:w-72 lg:w-52 border ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    } hover:shadow-[0px_0px_5px_4px_#e9d8fd] duration-300 focus:border-pink-400 focus:shadow-[0px_0px_5px_4px_#e9d8fd]`}
                  />
                  {errors.username && (
                    <span className="text-red-500 text-sm">
                      {errors.username.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-[1rem] font-bold">
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
              <div className="flex flex-col gap-1">
                <label htmlFor="businessName" className="text-[1rem] font-bold">
                  Business Name
                </label>
                <input
                  name="businessName"
                  id="businessName"
                  {...register("businessName", {
                    required: "Business Name is required",
                  })}
                  className={`outline-none pl-3 rounded-lg h-[3.2rem] border ${
                    errors.businessName ? "border-red-500" : "border-gray-300"
                  } hover:shadow-[0px_0px_5px_4px_#e9d8fd] duration-300 focus:border-pink-400 focus:shadow-[0px_0px_5px_4px_#e9d8fd]`}
                />
                {errors.businessName && (
                  <span className="text-red-500 text-sm">
                    {errors.businessName.message}
                  </span>
                )}
              </div>
              <div className="relative flex flex-col gap-1">
                <label htmlFor="password" className="text-[1rem] font-bold">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className={`outline-none pl-3 rounded-lg h-[3.2rem] border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } hover:shadow-[0px_0px_5px_4px_#e9d8fd] duration-300 focus:border-pink-400 focus:shadow-[0px_0px_5px_4px_#e9d8fd]`}
                />
                {!showPassword && (
                  <div
                    className="absolute right-4 top-8 h-[3rem] w-[2rem] flex justify-center items-center hover:cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <img
                      src="/close.svg"
                      alt="close-eye"
                      className="h-full w-full"
                    />
                  </div>
                )}
                {showPassword && (
                  <div
                    className="absolute right-4 top-8 h-[3rem] w-[2rem] flex justify-center items-center hover:cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <img
                      src="/show.svg"
                      alt="open-eye"
                      className="h-full w-full"
                    />
                  </div>
                )}
                {errors.password && (
                  <span className="text-red-500 text-sm">
                    {errors.password.message}
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
                  value={isSubmitting ? "Registering..." : "Create Account"}
                />
              </div>
              <div className="flex justify-center text-[1rem] text-gray-700">
                <span>
                  Already have an account?{" "}
                  <Link to="/signin" className="underline">
                    SignIn
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
