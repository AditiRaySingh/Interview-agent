import React, { useState } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { ServerUrl } from "../App";

import {
  FaUserTie,
  FaBriefcase,
  FaFileUpload,
  FaMicrophoneAlt,
  FaChartLine,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";

function Step1SetUp({ onStart }) {
  const {userData}=useSelector((state)=>state.user)
  
  const dispatch=useDispatch()
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("Technical");

  const [resumeFile, setResumeFile] = useState(null);

  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [resumeText, setResumeText] = useState("");

  const [analysisDone, setAnalysisDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUploadResume = async () => {
    if (!resumeFile || analyzing) return;

    try {
    
      setAnalyzing(true);

      const formData = new FormData();
      formData.append("resume", resumeFile);

      const result = await axios.post(
        ServerUrl + "/api/interview/resume",
        formData,
        {
          withCredentials: true,
        }
      );

      console.log(result.data);

      setRole(result.data.role || "");
      setExperience(result.data.experience || "");
      setProjects(result.data.projects || []);
      setSkills(result.data.skills || []);
      setResumeText(result.data.resumeText || "");

      setAnalysisDone(true);
    } catch (error) {
      console.log(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStart = async () => {
  setLoading(true);

  try {
    const result = await axios.post(
      ServerUrl + "/api/interview/generate-questions",
      {
        role,
        experience,
        mode,
        resumeText,
        projects,
        skills,
      },
      {
        withCredentials: true,
      }
    );

    console.log(result.data);

    if (userData) {
      dispatch(
        setUserData({
          ...userData,
          credits: result.data.creditsLeft,
        })
      );
    }

    setLoading(false);
    onStart(result.data);
  } catch (error) {
    console.log("Full Error:", error);
    console.log("Response:", error.response);
    console.log("Response Data:", error.response?.data);
    console.log("Message:", error.response?.data?.message);

    setLoading(false);
  }
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4"
    >
  <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden">
      {/* LEFT SIDE */}
<motion.div
  initial={{ x: -80, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.7 }}
  className="relative bg-gradient-to-br from-green-50 to-green-100 p-12 flex flex-col justify-center"
>
  <h2 className="text-4xl font-bold text-gray-800 mb-6">
    Start Your AI Interview
  </h2>

  <p className="text-gray-600 mb-8">
    Practice real interview scenarios powered by AI.
    Improve communication, technical skills, and confidence.
  </p>

  <div className="space-y-5">
    {[
      {
        icon: <FaUserTie className="text-green-600 text-xl" />,
        text: "Choose Role & Experience",
      },
      {
        icon: <FaMicrophoneAlt className="text-green-600 text-xl" />,
        text: "Smart Voice Interview",
      },
      {
        icon: <FaChartLine className="text-green-600 text-xl" />,
        text: "Performance Analytics",
      },
    ].map((item, index) => (
      <motion.div
        key={index}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.3 + index * 0.15,
        }}
        whileHover={{ scale: 1.03 }}
        className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm cursor-pointer"
      >
        {item.icon}

        <span className="text-gray-700 font-medium">
          {item.text}
        </span>
      </motion.div>
    ))}
  </div>
</motion.div>

{/* RIGHT SIDE */}
<motion.div
  initial={{ x: 80, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.7 }}
  className="p-12 bg-white"
>
  <h2 className="text-3xl font-bold text-gray-800 mb-8">
    Interview Setup
  </h2>

  <div className="space-y-6">

    {/* ROLE */}
    <div className="relative">
      <FaUserTie className="absolute top-4 left-4 text-gray-400" />

      <input
        type="text"
        placeholder="Enter role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
      />
    </div>

    {/* EXPERIENCE */}
    <div className="relative">
      <FaBriefcase className="absolute top-4 left-4 text-gray-400" />

      <input
        type="text"
        placeholder="Enter experience (e.g. 2 years)"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
      />
    </div>

    {/* INTERVIEW MODE */}
    <select
      value={mode}
      onChange={(e) => setMode(e.target.value)}
      className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
    >
      <option value="Technical">Technical Interview</option>
      <option value="HR">HR Interview</option>
    </select>
    {/* Resume Upload */}
{!analysisDone && (
  <motion.div
    whileHover={{ scale: 1.02 }}
    onClick={() =>
      document.getElementById("resumeUpload")?.click()
    }
    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
  >
    <FaFileUpload className="text-4xl mx-auto text-green-600 mb-3" />

    <input
      type="file"
      accept="application/pdf"
      id="resumeUpload"
      className="hidden"
      onChange={(e) => setResumeFile(e.target.files[0])}
    />

    <p className="text-gray-600 font-medium">
      {resumeFile
        ? resumeFile.name
        : "Click to upload resume (optional)"}
    </p>

    {resumeFile && (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={(e) => {
          e.stopPropagation();
          handleUploadResume();
        }}
        className="mt-4 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
      >
        {analyzing ? "Analyzing..." : "Analyze Resume"}
      </motion.button>
    )}
  </motion.div>
)}

{/* Resume Analysis */}
{analysisDone && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gray-50 border border-gray-200 rounded-xl p-5"
  >
    <h3 className="text-xl font-bold text-gray-800 mb-4">
      Resume Analysis Result
    </h3>

    <div className="mb-4">
      <h4 className="font-semibold text-gray-700">
        Suggested Role
      </h4>

      <p className="text-gray-600 mt-1">
        {role}
      </p>
    </div>

    <div className="mb-4">
      <h4 className="font-semibold text-gray-700">
        Experience
      </h4>

      <p className="text-gray-600 mt-1">
        {experience}
      </p>
    </div>

    <div className="mb-4">
      <h4 className="font-semibold text-gray-700 mb-2">
        Projects
      </h4>

      {projects.length > 0 ? (
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          {projects.map((project, index) => (
            <li key={index}>{project}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">
          No Projects Found
        </p>
      )}
    </div>

    <div>
      <h4 className="font-semibold text-gray-700 mb-2">
        Skills
      </h4>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          No Skills Found
        </p>
      )}
    </div>
  </motion.div>
)}
{/* Start Interview Button */}
<motion.button
onClick={handleStart}
  disabled={!role || !experience || loading}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
 
  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl text-lg font-semibold shadow-md transition"
>
  {loading ? "Starting..." : "Start Interview"}
</motion.button>

      </div>
    </motion.div>

  </div>
</motion.div>
);
}

export default Step1SetUp;