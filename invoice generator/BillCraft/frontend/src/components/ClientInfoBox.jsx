import React from "react";

const ClientInfoBox = ({ name, email, userAvatar, removeClient, clientId }) => {
  return (
    <>
      <div className="inline-flex flex-col gap-4 bg-teal-100 rounded-b-2xl rounded-t-[7rem] shadow-[20px_20px_50px_10px_#1a202c] md:hover:scale-105 duration-500 w-[13rem]">
        <div className="h-[13rem] w-[13rem] rounded-full overflow-hidden border-4 border-teal-900">
          <img
            src={`${userAvatar}`}
            alt="avatar"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="font-bold py-3 px-1 flex flex-col items-center gap-1">
          <p className="text-lg break-all">{name}</p>
          <p className="text-sm text-gray-500 break-all">{email}</p>
        </div>
        <div
          className={`${
            clientId === "Anup-default" && "hidden"
          } flex justify-center mb-4`}
        >
          <div
            onClick={() => removeClient(clientId)}
            className="h-11 w-11 hover:cursor-pointer rounded-full"
          >
            <img src="remove.svg" alt="remove" className="h-full w-full" />
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientInfoBox;
