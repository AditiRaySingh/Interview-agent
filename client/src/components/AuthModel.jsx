import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import Auth from "../Pages/Auth.jsx";

function AuthModel({ onClose }) {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (userData) {
      onClose();
    }
  }, [userData, onClose]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">

      <div className="relative w-full max-w-md">

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 text-gray-600 hover:text-black transition"
        >
          <FaTimes size={18} />
        </button>

        {/* Authentication */}
        <Auth isModel={true} />

      </div>

    </div>
  );
}

export default AuthModel;