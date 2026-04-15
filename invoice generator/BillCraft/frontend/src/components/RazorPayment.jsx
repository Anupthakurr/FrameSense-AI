import { useEffect, useState } from "react";
import axios from "axios";

const RazorpayPayment = ({ amount }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Please refresh and try again.");
      return;
    }

    setLoading(true); // Disable button on click

    try {
      const { data } = await axios.post("/api/v1/payment/create-order", {
        amount,
        currency: "INR",
      });

      const options = {
        key: "rzp_test_ZF9TzfhKAauAQK",
        amount: data.amount,
        currency: data.currency,
        order_id: data.id,
        name: "SmartInvoice",
        description: "Test Transaction",
        image: "/space.jpg",
        handler: function () {
          alert(
            "Congratulations! You now have access to all the premium templates!",
          );
          window.location.reload();
        },
        theme: { color: "#3399cc" },
        method: { upi: true },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", function () {
        alert("Payment failed. Please try again.");
        setLoading(false); // Re-enable button if payment fails
      });
    } catch (error) {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`bg-gradient-to-tl from-gray-900 to-lime-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 ${
        loading
          ? "opacity-50 cursor-not-allowed"
          : "hover:from-lime-800 hover:to-lime-900"
      }`}
    >
      {loading ? "Processing..." : "Premium"}
    </button>
  );
};

export default RazorpayPayment;
