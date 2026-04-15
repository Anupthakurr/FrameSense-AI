import React from "react";
import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="flex flex-col items-center gap-5">
        <h1 className='text-[8rem] xsm:text-[10rem] md:text-[15rem] font-[900] bg-[url("/space.jpg")] bg-cover bg-clip-text text-transparent text-black'>
          Oops!
        </h1>
        <h2 className="font-bold text-lg xsm:text-xl md:text-2xl">
          404 - PAGE NOT FOUND
        </h2>
        <p className="w-1/2 text-center font-light">{`The page you are looking for might not be available, have been removed, had it's name changed or is temporarily unavailable`}</p>
        <button
          onClick={() => navigate("/")}
          className="text-white font-bold bg-blue-700 py-3 px-6 rounded-full shadow-[0px_6px_20px_0px_#2b6cb0]"
        >
          GO TO HOMEPAGE
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
