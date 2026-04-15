import React, { useEffect, useState } from "react";
import ClientInfoBox from "../components/ClientInfoBox.jsx";
import AddClientForm from "../components/AddClientForm.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { IoArrowBackCircle } from "react-icons/io5";

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([
    {
      _id: "Anup-default",
      name: "Anup's Fav Client 😄",
      email: "soyaa0301@gmail.com",
      userAvatar: "jisoo.webp",
    },
  ]);
  const [toggleForm, setToggleForm] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get("/api/v1/profile/clients");
        setClients(response.data.data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchClients();
  }, [clients, toggleForm]);

  const removeClient = async (clientId) => {
    if (!window.confirm("Are you sure you want to remove the client?")) return;
    try {
      await axios.delete(`/api/v1/profile/remove/${clientId}`);
      setClients((prevClients) =>
        prevClients.filter((client) => client._id !== clientId),
      );
    } catch (error) {
      navigate("/error");
    }
  };

  const handleClick = () => {
    setToggleForm(1 - toggleForm);
  };

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="spinner-border animate-spin h-24 w-24 border-t-4 border-teal-700 rounded-full"></div>
        </div>
      )}
      {toggleForm === 1 && <AddClientForm handleClick={handleClick} />}
      <div
        className={`${
          toggleForm === 1 && "hidden"
        } min-h-screen bg-teal-900 py-3 px-10`}
      >
        <div className="flex justify-between mb-6">
          <div
            onClick={() => navigate("/home")}
            className="bg-green-600 hover:bg-green-700 flex items-center px-2 border-2 border-black rounded-lg gap-1 hover:cursor-pointer"
          >
            <IoArrowBackCircle />
            <button className="hidden sm:flex font-bold">
              Back to dashboard
            </button>
            <button className="sm:hidden font-bold">Back</button>
          </div>
          <button
            onClick={() => handleClick()}
            className={`bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full font-bold border-2 border-black`}
          >
            Add Client
          </button>
        </div>
        <div className={`flex flex-wrap gap-28 justify-evenly`}>
          {clients.map((values) => (
            <ClientInfoBox
              key={values._id}
              name={values.name}
              email={values.email}
              userAvatar={values.userAvatar}
              removeClient={removeClient}
              clientId={values._id}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Clients;
