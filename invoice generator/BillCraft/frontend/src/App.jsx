import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import Clients from "./pages/Clients.jsx";
import Welcome from "./pages/Welcome.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import Template1 from "./pages/templates/Template1.jsx";
import TermsAndConditions from "./pages/TermsAndConditions.jsx";
import CancellationAndRefund from "./pages/CancellationAndRefund.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import ContactUs from "./pages/ContactUs.jsx";

const router = createBrowserRouter([
    {
    path: "/",
    element: <Welcome />
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/signin",
    element: <SignIn />
  },
  {
    path: "/clients",
    element: <Clients />
  },

  {
    path: "/template1",
    element: <Template1 />
  },
  {
    path: "/terms-and-conditions",
    element: <TermsAndConditions />
  },
  {
    path: "/cancellation-and-refund",
    element: <CancellationAndRefund />
  },
  {
    path: "privacy-policy",
    element: <PrivacyPolicy />
  },
  {
    path: "contact-us",
    element: <ContactUs />
  },
  {
    path: "*",
    element: <ErrorPage />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
