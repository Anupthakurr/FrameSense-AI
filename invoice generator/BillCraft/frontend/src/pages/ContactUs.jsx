import React from "react";

const ContactUs = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-4">Contact Us</h1>
      <p className="text-gray-700 text-center">Last updated on Feb 6, 2025</p>

      <div className="mt-6 space-y-4">
        <p>
          <strong>Merchant Legal Entity Name:</strong> Anup
        </p>
        <p>
          <strong>Registered Address:</strong> H- no 3, gali no 6, North West
          Delhi, DELHI 110042
        </p>
        <p>
          <strong>Telephone No:</strong>{" "}
          <a href="tel:9896198604" className="text-blue-600 hover:underline">
            9896198604
          </a>
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a
            href="mailto:anupthakur150@gmail.com"
            className="text-blue-600 hover:underline"
          >
            anupthakur150@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContactUs;
