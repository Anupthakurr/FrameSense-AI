import React from "react";
import { useNavigate, Link } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="min-h-screen bg-black flex flex-col justify-center">
        <div className="flex text-white items-center gap-1 absolute left-4 top-4">
          <h1 className="text-3xl font-dancing-script lg:font-great-vibes-regular">
            SmartInvoice
          </h1>
          <img src="/invoice.svg" alt="" className="h-5 w-5" />
        </div>
        <div className="h-full rounded-xl text-white flex flex-col lg:flex-row-reverse justify-center items-center gap-20 lg:gap-0">
          <div className="w-full lg:w-1/2 flex justify-center items-center">
            <div className="h-[15rem] w-[15rem] xsm:h-[20rem] xsm:w-[20rem] sm:h-[25rem] sm:w-[25rem] flex justify-center items-center rounded-full overflow-hidden bg-gradient-to-r from-slate-900 to-slate-700 shadow-[0px_0px_20px_10px_#81e6d9]">
              <p className="text-7xl xsm:text-8xl sm:text-9xl font-dancing-script">
                Hello
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center lg:items-start gap-8 w-full lg:w-1/2 lg:pl-14">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl xsm:text-5xl md:text-7xl">
                Welcome to{" "}
                <span className="font-dancing-script lg:font-great-vibes-regular">
                  SmartInvoice
                </span>
              </h1>
              {/* <img src="invoice.svg" alt="logo" className="lg:hidden h-10 w-10 md:h-14 md:w-14" /> */}
            </div>
            <div className="w-2/3 text-gray-400">
              <p className="text-center lg:text-start text-xs xsm:text-sm sm:text-base md:text-lg">
                Effortlessly manage clients and create custom invoices using our
                beautiful, customizable templates.
              </p>
            </div>
            <div className="mb-4">
              <button
                onClick={() => navigate("/signin")}
                className="bg-teal-600 hover:bg-teal-700 py-3 px-6 sm:py-4 sm:px-8 rounded-2xl font-bold text-xl sm:text-2xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-teal-950 text-gray-400 flex flex-col py-1 items-center justify-center w-full">
        <p>© 2025 SmartInvoice</p>
        <div className="flex text-xs xsm:text-sm gap-2 xsm:gap-3 sm:text-base underline underline-offset-1">
          <Link to="/terms-and-conditions">Terms & Conditions</Link>

          <Link to="/privacy-policy">Privacy Policy</Link>

          <Link to="/cancellation-and-refund">Refund Policy</Link>

          <Link to="/contact-us">Contact Us</Link>
        </div>
      </div>
    </>
  );
};

export default Welcome;
