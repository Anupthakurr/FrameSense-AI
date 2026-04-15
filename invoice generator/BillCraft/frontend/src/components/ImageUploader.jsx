import React, { useRef, useState } from "react";

const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleDeleteClick = () => {
    setImage(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="relative bg-gray-100 h-full w-[10rem] rounded-lg overflow-hidden flex justify-center items-center hover:cursor-pointer"
      >
        {image ? (
          <>
            <img
              src={image}
              alt="Selected"
              className="h-full w-full object-cover"
            />
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
              className="absolute left-1 top-1 bg-gray-700 h-6 w-6 rounded-md hover:bg-orange-600"
            >
              <img src="cross.svg" alt="cross" />
            </div>
          </>
        ) : (
          <div className="text-gray-400 flex justify-center items-center gap-1 h-full w-full">
            <div>
              <p className="text-3xl">+</p>
            </div>
            <div>
              <p>Add Your Logo</p>
            </div>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </>
  );
};

export default ImageUploader;
