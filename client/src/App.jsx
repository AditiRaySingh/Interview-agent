import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import Home from "./Pages/Home.jsx";
import Auth from "./Pages/Auth.jsx";
import InterviewPage from "./Pages/InterviewPage.jsx";
import Pricing from "./Pages/Pricing.jsx";
import InterviewReport from "./Pages/InterviewReport.jsx";
import InterviewHistory from "./Pages/InterviewHistory.jsx";

import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userSlice.js";

export const ServerUrl =
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:3000";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(
          ServerUrl + "/api/user/current-user",
          {
            withCredentials: true,
          }
        );

        dispatch(setUserData(result.data));
      } catch (error) {
        console.error("Current user error:", error);
        dispatch(setUserData(null));
      }
    };

    getUser();
  }, [dispatch]);

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/history" element={<InterviewHistory />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/report/:id"
          element={<InterviewReport />}
        />
      </Routes>
    </div>
  );
}

export default App;