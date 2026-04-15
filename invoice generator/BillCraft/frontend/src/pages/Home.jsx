import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AvatarUploader from "../components/AvatarUploader.jsx";
import { GiHamburgerMenu } from "react-icons/gi";
import { ImCross } from "react-icons/im";
import { TbLogout2 } from "react-icons/tb";
import { RxAvatar } from "react-icons/rx";
import RazorpayPayment from "../components/RazorPayment.jsx";

const Home = () => {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(null);
  const [toggle, setToggle] = useState(0);
  const [userInfo, setUserInfo] = useState([]);
  const [templates, setTemplates] = useState([1, 2]);
  const [premiumTemplates, setPremiumTemplates] = useState([
    1, 2, 3, 4, 5, 6, 7, 8,
  ]);
  const [hamBurgerMenu, setHamBurgerMenu] = useState(1);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await axios.get("/api/v1/profile");
        setUserInfo(response.data.data);
        if (response.status !== 200) {
          navigate("/error");
        }
      } catch (error) {
        navigate("/");
      }
    };
    const getAvatar = async () => {
      try {
        const response = await axios.get("/api/v1/userAvatar/getAvatar");
        setAvatar(response.data.data.avatarUrl);
      } catch (error) {
        navigate("/");
      }
    };
    const fetchData = async () => {
      await verifyUser();
      await getAvatar();
      setLoading(false);
    };
    fetchData();
  }, [navigate, toggle]);

  const handleClick = () => {
    setToggle(1 - toggle);
  };
  const handleHamBurgerClick = () => {
    setHamBurgerMenu(1 - hamBurgerMenu);
  };

  const handleLogoutClick = async () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      localStorage.removeItem("accessToken");
    }
    try {
      await axios.post("/api/v1/user/logout", {}, { withCredentials: true });
      navigate("/signin");
    } catch (error) {
      navigate("/error");
    }
  };

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="spinner-border animate-spin h-24 w-24 border-t-4 border-green-600 rounded-full"></div>
        </div>
      )}
      {toggle === 1 && <AvatarUploader handleClick={handleClick} />}
      <div className={`${toggle === 1 && "hidden"} min-h-screen flex`}>
        <div className="hidden w-[20%] bg-gradient-to-tl from-gray-900 to-lime-700 lg:flex flex-col justify-between items-center py-7 text-gray-200">
          <div className="flex flex-col gap-20">
            <div className="flex-col">
              <div className="flex gap-1 justify-center">
                <h1 className="font-great-vibes-regular font-bold text-2xl">
                  SmartInvoice
                </h1>
                <img src="invoice.svg" alt="invoice" className="h-6 w-6" />
              </div>
              {userInfo.isAdmin && (
                <div className="flex justify-center">
                  <button className="bg-gradient-to-r from-amber-200 to-yellow-500 flex justify-center items-center text-black rounded-full px-2 border border-black font-serif">
                    Premium
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex flex-col gap-1 items-center">
                <div className="h-20 w-20 rounded-full overflow-hidden">
                  <img src={avatar} alt="avatar" />
                </div>
                <h1 className="text-2xl hover:text-green-200">
                  {userInfo.fullname}
                </h1>
              </div>
              <div className="flex items-center gap-1">
                <RxAvatar />
                <button className="hover:text-green-200" onClick={handleClick}>
                  Add Yours
                </button>
              </div>
            </div>
          </div>

          <div
            onClick={handleLogoutClick}
            className="flex justify-center items-center sticky bottom-8 gap-1 hover:cursor-pointer"
          >
            <TbLogout2 className="text-2xl text-gray-200" />
            <button className="font-bold text-2xl hover:text-green-200 text-gray-200">
              Log Out
            </button>
          </div>
        </div>
        <div className="w-full lg:w-[80%] px-8 pt-8 flex flex-col gap-14">
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl xsm:text-2xl sm:text-4xl font-bold">
                Welcome back, {userInfo.fullname}
              </h1>
              <h2 className="text-xs xsm:text-sm sm:text-base text-gray-500">
                Take a look at all the beautiful templates available
              </h2>
            </div>
            <div className="flex justify-center items-center">
              <button
                onClick={() => navigate("/clients")}
                className="hidden lg:block bg-gradient-to-tl from-gray-900 to-lime-700 text-white text-xl py-3 px-8 rounded-full hover:text-green-200"
              >
                Clients
              </button>
              <div
                className={`${
                  hamBurgerMenu === 1 && "hidden"
                } absolute rounded-bl-3xl lg:hidden bg-black text-white flex flex-col items-center h-1/2 w-1/2 top-0 right-0`}
              >
                <div className="flex flex-col items-center gap-2 mt-24">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-full">
                    <img src={avatar} alt="avatar" />
                  </div>
                  <h1 className="text-xl sm:text-2xl">{userInfo.fullname}</h1>
                  <div className="flex items-center gap-1 mt-2 text-lg sm:text-xl">
                    <RxAvatar />
                    <button onClick={handleClick}>Add Yours</button>
                  </div>
                  <div>
                    <button
                      onClick={() => navigate("/clients")}
                      className="text-lg sm:text-xl"
                    >
                      Clients
                    </button>
                  </div>
                </div>
                <div
                  onClick={handleLogoutClick}
                  className="flex justify-center items-center hover:cursor-pointer absolute bottom-5 gap-1"
                >
                  <TbLogout2 className="text-2xl" />
                  <button className="font-bold text-xl sm:text-2xl">
                    Log Out
                  </button>
                </div>
              </div>
              <GiHamburgerMenu
                onClick={handleHamBurgerClick}
                className={`${
                  hamBurgerMenu === 0 && "hidden"
                } absolute top-8 right-6 lg:hidden text-xl sm:text-3xl text-black hover:cursor-pointer`}
              />
              <ImCross
                onClick={handleHamBurgerClick}
                className={`${
                  hamBurgerMenu === 1 && "hidden"
                } absolute top-9 right-7 lg:hidden text-lg sm:text-2xl text-white hover:cursor-pointer`}
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-evenly gap-8">
            {!userInfo.isAdmin &&
              templates.map((template) => (
                <div
                  key={template}
                  onClick={() =>
                    window.open(
                      "https://invoice-generator-xt5k.vercel.app/template1",
                    )
                  }
                  className="h-[30rem] w-[20rem] rounded-lg border border-gray-300 overflow-hidden hover:cursor-pointer lg:hover:scale-105 duration-500"
                >
                  <img
                    src="/temp1.png"
                    alt="template1"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            {userInfo.isAdmin &&
              premiumTemplates.map((template) => (
                <div
                  key={template}
                  onClick={() =>
                    window.open(
                      "https://invoice-generator-xt5k.vercel.app/template1",
                    )
                  }
                  className="h-[30rem] w-[20rem] rounded-lg border border-gray-300 overflow-hidden hover:cursor-pointer lg:hover:scale-105 duration-500"
                >
                  <img
                    src="/temp1.png"
                    alt="template1"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            {!userInfo.isAdmin && (
              <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 w-full p-4 rounded-lg shadow-md text-center">
                <p className="text-lg font-semibold text-gray-900">
                  Want to explore more cooler templates?
                </p>
                <div className="flex justify-center items-center gap-1 mt-1">
                  <p className="text-base text-gray-800">Go Premium</p>
                  <img
                    src="forwardhand.svg"
                    alt="forwardhand"
                    className="h-10 w-10"
                  />
                  <RazorpayPayment amount={10} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
