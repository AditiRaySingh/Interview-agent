import React from "react";
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";
import { ServerUrl } from "../App";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

function Auth({ isModel = false }) {
  const dispatch = useDispatch();

  const handleGoogleAuth = async () => {
    try {
      console.log("Step 1: Starting Google Login");

      // Google Sign-In
      const response = await signInWithPopup(auth, provider);

      console.log("Step 2: Google Login Successful");

      const user = response.user;

      console.log("Step 3: User:", user);

      const name = user.displayName;
      const email = user.email;

      console.log("Sending to Backend:", { name, email });

      // Send user data to backend
      const result = await axios.post(
        `${ServerUrl}/api/auth/google`,
        {
          name,
          email,
        },
        {
          withCredentials: true,
        }
      );

      console.log("Step 4: Backend Response:", result.data);

      // Store logged-in user in Redux
      dispatch(setUserData(result.data));

      console.log("Step 5: User saved in Redux");

    } catch (error) {
      console.log("========== GOOGLE LOGIN ERROR ==========");

      console.log("Error Code:", error.code);
      console.log("Error Message:", error.message);

      if (error.response) {
        console.log("Backend Response:", error.response.data);
      }

      if (error.request) {
        console.log("No response received from backend.");
      }

      console.log(error);
    }
  };

  return (
    <div
      className={
        isModel
          ? "w-full"
          : "w-full min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20"
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.05 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-gray-200"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>

          <h2 className="font-semibold text-lg">
            InterViewIQ.AI
          </h2>
        </div>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug mb-4">
          Continue with{" "}
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2">
            <IoSparkles size={16} />
            AI Smart Interview
          </span>
        </h1>

        {/* Description */}
        <p className="text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8">
          Sign in to start AI-powered mock interviews, track your progress,
          and unlock detailed performance insights.
        </p>

        {/* Google Login */}
        <motion.button
          onClick={handleGoogleAuth}
          whileHover={{ opacity: 0.9, scale: 1.03 }}
          whileTap={{ opacity: 1, scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md"
        >
          <FcGoogle size={20} />
          Continue with Google
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Auth;
