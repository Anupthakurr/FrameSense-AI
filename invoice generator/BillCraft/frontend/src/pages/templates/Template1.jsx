import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ImageUploader from "../../components/ImageUploader.jsx";
import Mailer from "../../components/Mailer.jsx";
import { countryList } from "./countryCodes.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Template1 = () => {
  const navigate = useNavigate();
  const downloadPdf = () => {
    const input = document.getElementById("template-1");
    html2canvas(input, { scale: 1 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4"); // Set PDF to A4 size

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Scale image to fit the full page of PDF
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save("invoice.pdf"); // Save the PDF with desired filename
    });
  };

  const [items, setItems] = useState([0]);
  const [amnt, setAmnt] = useState([0]);
  const priceRef = useRef([]);
  const qtyRef = useRef([]);
  const taxRef = useRef(0);
  const discountRef = useRef(0);
  const [totalSum, setTotalSum] = useState(0);
  const [subTotalSum, setSubTotalSum] = useState(0);
  const [countrySymbol, setCountrySymbol] = useState("$");
  const [toggle, setToggle] = useState(0);
  const [loading, setLoading] = useState(true);

  const updateTotalSum = () => {
    const newTotal = amnt.reduce((acc, curr) => acc + curr, 0);
    setTotalSum(newTotal);
    const tax = taxRef.current.value ? parseFloat(taxRef.current.value) : 0;
    const discount = discountRef.current.value
      ? parseFloat(discountRef.current.value)
      : 0;
    if (tax < 0 || discount < 0) {
      alert("Tax and discount cannot be negative!");
      return;
    }
    const finalTotal =
      newTotal + (newTotal * tax) / 100 - (newTotal * discount) / 100;
    setSubTotalSum(finalTotal);
  };
  const handleItemClick = (e) => {
    let newArr = [];
    let newAmntArr = [];
    if (e === "add") {
      newArr = [...items, items[items.length - 1] + 1];
      newAmntArr = [...amnt, 0];
    } else {
      newArr = items.slice(0, -1);
      newAmntArr = amnt.slice(0, -1);
    }
    setItems(newArr);
    setAmnt(newAmntArr);
  };
  const handlePriceOrQtyChange = (idx) => {
    const price = parseFloat(priceRef.current[idx].value) || 0;
    const qty = parseFloat(qtyRef.current[idx].value) || 0;

    // Prevent negative values for price and quantity
    if (price < 0 || qty < 0) {
      alert("Price and quantity cannot be negative!");
      return;
    }

    const updatedAmounts = [...amnt];
    updatedAmounts[idx] = price * qty;
    setAmnt(updatedAmounts);
  };
  const handleCurrChange = (e) => {
    const keyCurrency = e.target.value;
    setCountrySymbol(countryList[keyCurrency]);
  };
  const handleClick = () => {
    setToggle(1 - toggle);
  };
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await axios.get("/api/v1/profile");
        if (response.status !== 200) {
          navigate("/error");
        }
      } catch (error) {
        navigate("/welcome");
      }
    };
    const fetchData = async () => {
      await verifyUser();
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    updateTotalSum();
  }, [amnt, taxRef.current.value, discountRef.current.value]);

  const itemFn = (idx) => {
    return (
      <>
        <div className="col-span-3 border border-black rounded-lg overflow-hidden">
          <input type="text" className="w-full h-10 outline-none pl-2" />
        </div>
        <div>
          <div className="flex items-center pl-2 border border-black rounded-lg overflow-hidden">
            <p>{countrySymbol}</p>
            <input
              type="number"
              ref={(el) => (priceRef.current[idx] = el)}
              onChange={() => handlePriceOrQtyChange(idx)}
              className="w-full h-10 outline-none pl-1"
              min="0"
            />
          </div>
        </div>
        <div>
          <input
            type="number"
            ref={(el) => (qtyRef.current[idx] = el)}
            onChange={() => handlePriceOrQtyChange(idx)}
            className="border w-full border-black rounded-lg h-10 outline-none pl-2"
            min="0"
          />
        </div>
        <div>
          <div className="flex items-center pl-2 border border-black rounded-lg overflow-hidden">
            <p>{countrySymbol}</p>
            <input
              type="number"
              disabled
              value={amnt[idx]}
              className="w-full h-10 outline-none pl-1 hover:cursor-not-allowed"
            />
          </div>
        </div>
        <div
          className={`col-span-6 mt-4 mb-4 border border-black ${
            items.length === 1 && "hidden"
          }`}
        ></div>
      </>
    );
  };
  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="spinner-border animate-spin h-24 w-24 border-t-4 border-orange-600 rounded-full"></div>
        </div>
      )}
      {toggle === 1 && <Mailer handleClick={handleClick} />}
      <div
        className={`${
          toggle === 1 && "md:hidden hidden"
        } min-h-screen gap-10 md:gap-0 flex flex-col md:flex md:flex-row`}
      >
        <div
          className="flex flex-col justify-between w-full md:w-[80%] border-r border-black"
          id="template-1"
        >
          <div className="flex flex-col gap-10">
            {" "}
            <div className="mt-8 flex flex-col-reverse gap-4 sm:gap-0 sm:flex sm:flex-row sm:justify-between sm:items-center">
              <div className="flex h-32 mx-8 xsm:mx-12 sm:mx-0 justify-between sm:justify-start sm:gap-5">
                <div className="hidden sm:block h-full w-8 bg-orange-400"></div>
                <ImageUploader />
                <div className="flex flex-col py-2 gap-2 justify-evenly w-[10rem] xsm:w-[15rem]">
                  <input
                    type="text"
                    placeholder="From"
                    className="text-3xl outline-none rounded-lg pl-2"
                  />
                  <textarea
                    placeholder="Address"
                    className="h-6 resize-none overflow-hidden outline-none rounded-lg pl-2"
                  ></textarea>
                  <input
                    type="text"
                    placeholder="Contact"
                    className="outline-none text-gray-600 rounded-lg pl-2"
                  />
                </div>
              </div>
              <div className="flex justify-end items-center">
                <h1 className="text-2xl font-bold bg-orange-500 px-6 py-3 rounded-l-full">
                  Invoice
                </h1>
              </div>
            </div>
            <div className="flex flex-col gap-4 xsm:gap-0 xsm:flex-row xsm:justify-between xsm:items-end xsm:mx-12 mx-8">
              <div className="flex flex-col w-[10rem] gap-2">
                <h1 className="text-3xl">Bill To:</h1>
                <input
                  type="text"
                  placeholder="name"
                  className="outline-none"
                />
                <input
                  type="text"
                  placeholder="address"
                  className="outline-none"
                />
                <input
                  type="text"
                  placeholder="contact"
                  className="outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <h1>Invoice no:</h1>
                  <input
                    type="text"
                    className="pl-2 outline-none text-end"
                    placeholder="invoice no"
                  />
                </div>
                <div className="flex justify-between">
                  <h1>Date:</h1>
                  <input
                    type="text"
                    className="pl-2 outline-none text-end"
                    placeholder="dd-mm-yyyy"
                  />
                </div>

                <div className="flex justify-between">
                  <h1>Due Date:</h1>
                  <input
                    type="text"
                    className="pl-2 outline-none text-end"
                    placeholder="due date"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-x-2 xsm:gap-x-8 xsm:mx-12 mx-8">
              <div className="col-span-3 font-bold">Item Description</div>
              <div className="font-bold">Price</div>
              <div className="font-bold">QTY</div>
              <div className="font-bold">Total</div>
              <div className="col-span-6 mt-2 mb-4 border border-black"></div>
              {items.map((idx) => itemFn(idx))}
            </div>
            <div className="xsm:mx-12 mx-8 flex gap-5">
              <button
                onClick={() => handleItemClick("add")}
                className="p-2 border border-green-500 rounded-lg"
              >
                Line item
              </button>
              <button
                onClick={() => handleItemClick("remove")}
                className={`p-2 border border-red-500 rounded-lg ${
                  items.length === 0 && "hidden"
                }`}
              >
                Remove Item
              </button>
            </div>
            <div className="xsm:mx-12 mx-8 flex justify-end">
              <div className="flex flex-col w-[45%] gap-2">
                <div className="flex justify-between">
                  <h1>Total</h1>
                  <h1>
                    {countrySymbol}
                    {totalSum}
                  </h1>
                </div>
                <div className="flex justify-between">
                  <h1>Tax (%)</h1>
                  <input
                    type="number"
                    ref={taxRef}
                    onChange={updateTotalSum}
                    placeholder="tax"
                    className="text-right appearance-none w-[5rem] outline-none"
                  />
                </div>
                <div className="flex justify-between">
                  <h1>Discount (%)</h1>
                  <input
                    type="number"
                    ref={discountRef}
                    onChange={updateTotalSum}
                    placeholder="discount"
                    className="text-right appearance-none w-[5rem] outline-none"
                  />
                </div>
                <div className="border border-black my-2"></div>
                <div className="flex justify-between">
                  <h1>Sub Total</h1>
                  <h1>
                    {countrySymbol}
                    {subTotalSum}
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex justify-between xsm:mx-12 mx-8 mt-4">
              <div className="flex flex-col w-1/2">
                <h1 className="font-bold text-2xl">Terms and Conditions</h1>
                <textarea
                  className="outline-none resize-none"
                  placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente fuga dolorem voluptatibus accusamus impedit ratione?."
                ></textarea>
              </div>
              <div className="flex flex-col items-end">
                <input
                  type="text"
                  placeholder="Anup Thakur"
                  className="text-end text-2xl font-bold outline-none  w-40 xsm:w-52"
                />
                <p className="font-bold">Manager</p>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="bg-orange-400 h-8 mt-6"></div>
        </div>

        <div className="w-full md:w-[20%] h-56 md:h-screen flex flex-col gap-5 md:justify-center items-center">
          <button
            onClick={handleClick}
            className="hidden md:block bg-yellow-500 hover:bg-yellow-600 py-3 px-5 rounded-xl text-[1.2rem] font-bold"
          >
            Direct mail
          </button>
          <button
            onClick={downloadPdf}
            className="hidden md:block bg-green-500 hover:bg-green-600 py-3 px-6 rounded-xl text-[1.2rem] font-bold"
          >
            Download
          </button>
          <div className="hidden md:block border border-gray-300 -mt-2 w-3/4"></div>
          <div className="flex items-center gap-3 md:flex-col md:items-start">
            <h1>Currency</h1>
            <div className="border border-gray-400 py-4 w-[8rem] flex rounded-xl">
              <select
                onChange={handleCurrChange}
                className="outline-none ml-2 w-[6rem] hover:cursor-pointer"
              >
                {Object.keys(countryList).map((curr) => (
                  <option key={curr} value={curr}>
                    {curr} {countryList[curr]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-500 flex justify-between px-5">
          <button
            onClick={handleClick}
            className="bg-yellow-500 hover:bg-yellow-600 font-bold py-3 px-2 rounded-lg my-2"
          >
            Direct mail
          </button>
          <button
            onClick={downloadPdf}
            className="bg-green-500 hover:bg-green-600 font-bold py-3 px-2 rounded-lg my-2"
          >
            Download
          </button>
        </div>
      </div>
    </>
  );
};

export default Template1;
