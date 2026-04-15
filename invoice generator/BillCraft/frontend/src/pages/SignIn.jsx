import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";

const SignIn = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      const response = await axios.post("/api/v1/user/login", data);
      navigate("/home");
    } catch (error) {
      setServerError(error.response?.data?.error || "Login failed");
    }
  };

  const getUserEmail = async (accessToken) => {
    try {
      // Make a GET request to the UserInfo API with the access token
      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include the access token in the Authorization header
          },
        },
      );

      // Extract the email from the response
      const email = response.data.email;

      // Return the user's email
      return email;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      localStorage.setItem("accessToken", tokenResponse.access_token);
      const email = await getUserEmail(tokenResponse.access_token);

      if (email) {
        try {
          const response = await axios.post(
            "/api/v1/user/google",
            { email }, // Ensure 'email' is sent in the request body
          );
          navigate("/home");
        } catch (error) {
          setServerError(error.response?.data?.error || "Login failed");
        }
      } else {
        console.log("Failed to get email from google");
      }
    },
    onError: (error) => {
      console.error("Login Failed:", error);
    },
    scope:
      "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email", // Corrected scopes
  });

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
        <div className="flex justify-center items-center w-2/3 lg:w-1/2 h-full">
          <div className="flex flex-col gap-[4rem] w-full lg:w-2/3">
            <h1 className="text-2xl sm:text-3xl font-bold text-left">
              LogIn To Your Account
            </h1>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-[1rem] font-bold">
                  Username or email
                </label>
                <input
                  name="identifier"
                  id="identifier"
                  {...register("identifier", {
                    required: "username or email is required",
                  })}
                  className={`outline-none pl-3 rounded-lg h-[3.2rem] border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } hover:shadow-[0px_0px_5px_4px_#e9d8fd] duration-300 focus:border-pink-400 focus:shadow-[0px_0px_5px_4px_#e9d8fd]`}
                />
                {errors.identifier && (
                  <span className="text-red-500 text-sm">
                    {errors.identifier.message}
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
                  value={isSubmitting ? "Loggin In..." : "LogIn"}
                />
              </div>
              <div className="flex justify-center -my-4 text-gray-500">OR</div>
              <button
                onClick={googleLogin}
                className="bg-gray-800 hover:bg-gray-900 w-full py-4 rounded-3xl text-white font-bold text-[0.9rem]"
              >
                Sign in with Google 🚀
              </button>
              <div className="flex justify-center text-[1rem] text-gray-700">
                <span>
                  {`Don't have an account yet?`}{" "}
                  <Link to="/register" className="underline">
                    SignUp
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

export default SignIn;
