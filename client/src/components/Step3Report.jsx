
import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import {
  buildStyles,
  CircularProgressbar,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import {
  Area,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Step3Report({ report }) {
  const navigate = useNavigate();

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading Report...</p>
      </div>
    );
  }

  const {
    finalScore = 0,
    confidence = 0,
    communication = 0,
    correctness = 0,
    questionWiseScore = [],
  } = report;

  // Chart data
  const questionScoreData = questionWiseScore.map((score, index) => ({
    name: `Q${index + 1}`,
    score: score.score || 0,
  }));

  // Skills
  const skills = [
    {
      label: "Confidence",
      value: confidence,
    },
    {
      label: "Communication",
      value: communication,
    },
    {
      label: "Correctness",
      value: correctness,
    },
  ];

  // Performance text
  let performanceText = "";
  let shortTagline = "";

  if (finalScore >= 8) {
    performanceText = "Ready for job opportunities";
    shortTagline = "Excellent clarity and structured responses";
  } else if (finalScore >= 5) {
    performanceText = "Needs minor improvement before interviews";
    shortTagline = "Good foundation, refine articulation";
  } else {
    performanceText = "Significant improvement required";
    shortTagline = "Work on clarity and confidence";
  }

  const score = Number(finalScore) || 0;
  const percentage = (score / 10) * 100;

  // Download PDF
  const downloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    let currentY = 25;

    // -------------------------
    // TITLE
    // -------------------------

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);

    doc.text(
      "AI Interview Performance Report",
      pageWidth / 2,
      currentY,
      {
        align: "center",
      }
    );

    currentY += 5;

    // Underline
    doc.setDrawColor(34, 197, 94);
    doc.line(
      margin,
      currentY + 2,
      pageWidth - margin,
      currentY + 2
    );

    currentY += 15;

    // -------------------------
    // FINAL SCORE BOX
    // -------------------------

    doc.setFillColor(240, 253, 244);

    doc.roundedRect(
      margin,
      currentY,
      contentWidth,
      20,
      4,
      4,
      "F"
    );

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);

    doc.text(
      `Final Score: ${score}/10`,
      pageWidth / 2,
      currentY + 12,
      {
        align: "center",
      }
    );

    currentY += 30;

    // -------------------------
    // SKILLS BOX
    // -------------------------

    doc.setFillColor(249, 250, 251);

    doc.roundedRect(
      margin,
      currentY,
      contentWidth,
      35,
      4,
      4,
      "F"
    );

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    doc.text(
      `Confidence: ${confidence}/10`,
      margin + 10,
      currentY + 10
    );

    doc.text(
      `Communication: ${communication}/10`,
      margin + 10,
      currentY + 20
    );

    doc.text(
      `Correctness: ${correctness}/10`,
      margin + 10,
      currentY + 30
    );

    currentY += 45;

    // -------------------------
    // PROFESSIONAL ADVICE
    // -------------------------

    let advice = "";

    if (score >= 8) {
      advice =
        "Excellent performance. Maintain confidence and structure. Continue refining clarity and support your answers with strong real-world examples.";
    } else if (score >= 5) {
      advice =
        "Good foundation shown. Improve clarity and answer structure. Practice explaining your thoughts with concise and relevant examples.";
    } else {
      advice =
        "Significant improvement required. Focus on structured thinking, clarity, and confident delivery. Practice answering interview questions aloud regularly.";
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220);

    doc.roundedRect(
      margin,
      currentY,
      contentWidth,
      40,
      4,
      4,
      "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    doc.text(
      "Professional Advice",
      margin + 10,
      currentY + 10
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const splitAdvice = doc.splitTextToSize(
      advice,
      contentWidth - 20
    );

    doc.text(
      splitAdvice,
      margin + 10,
      currentY + 20
    );

    currentY += 55;

    // -------------------------
    // QUESTION TABLE
    // -------------------------

    autoTable(doc, {
      startY: currentY,

      margin: {
        left: margin,
        right: margin,
      },

      head: [
        ["#", "Question", "Score", "Feedback"],
      ],

      body: questionWiseScore.map((q, i) => [
        `${i + 1}`,
        q.question || "Question not available",
        `${q.score ?? 0}/10`,
        q.feedback || "No feedback available",
      ]),

      styles: {
        fontSize: 8,
        cellPadding: 4,
        valign: "top",
      },

      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 10,
          halign: "center",
        },

        1: {
          cellWidth: 55,
        },

        2: {
          cellWidth: 20,
          halign: "center",
        },

        3: {
          cellWidth: "auto",
        },
      },

      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    // Save PDF
    doc.save("AI_Interview_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 px-4 sm:px-6 lg:px-10 py-8">

      {/* HEADER */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div className="w-full flex items-start gap-4 flex-wrap">

          {/* Back Button */}
          <button
            onClick={() => navigate("/history")}
            className="mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Interview Analytics Dashboard
            </h1>

            <p className="text-gray-500 mt-2">
              AI Powered Performance Insights
            </p>
          </div>
        </div>

        {/* Download PDF */}
        <button
          onClick={downloadPDF}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-md transition-all duration-300 font-semibold text-sm sm:text-base whitespace-nowrap"
        >
          Download PDF
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* LEFT SIDE */}
        <div className="space-y-6">

          {/* OVERALL PERFORMANCE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 text-center"
          >
            <h3 className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
              Overall Performance
            </h3>

            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto">

              <CircularProgressbar
                value={percentage}
                text={`${score}/10`}
                styles={buildStyles({
                  textSize: "22px",
                  pathColor: "#10b981",
                  textColor: "#374151",
                  trailColor: "#e5e7eb",
                })}
              />

            </div>

            <div className="mt-4">

              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                {performanceText}
              </p>

              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                {shortTagline}
              </p>

            </div>
          </motion.div>

          {/* SKILL EVALUATION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-6">
              Skill Evaluation
            </h3>

            <div className="space-y-5">

              {skills.map((s, i) => (
                <div key={i}>

                  <div className="flex justify-between mb-2 text-sm sm:text-base">

                    <span className="font-semibold text-gray-700">
                      {s.label}
                    </span>

                    <span className="font-semibold text-green-600">
                      {s.value}/10
                    </span>

                  </div>

                  <div className="bg-gray-200 h-2 sm:h-3 rounded-full">

                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(Number(s.value) * 10, 100)}%`,
                      }}
                    />

                  </div>

                </div>
              ))}

            </div>
          </motion.div>

        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-2 space-y-6">

          {/* PERFORMANCE TREND */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 sm:mb-6">
              Performance Trend
            </h3>

            <div className="h-64 sm:h-72">

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart data={questionScoreData}>

                  <XAxis dataKey="name" />

                  <YAxis domain={[0, 10]} />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    fill="#bbf7d0"
                    strokeWidth={3}
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>
          </motion.div>

          {/* QUESTION ANALYSIS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8"
          >

            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-6">
              Question-wise Analysis
            </h3>

            <div className="space-y-6">

              {questionWiseScore.length === 0 ? (

                <p className="text-gray-500 text-center py-5">
                  No question-wise data available.
                </p>

              ) : (

                questionWiseScore.map((q, i) => (

                  <div
                    key={i}
                    className="bg-gray-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200"
                  >

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">

                      <div>

                        <p className="text-xs text-gray-400 mb-1">
                          Question {i + 1}
                        </p>

                        <p className="font-semibold text-gray-800 text-sm sm:text-base leading-relaxed">
                          {q.question || "Question not available"}
                        </p>

                      </div>

                      <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold text-xs sm:text-sm w-fit">
                        {q.score ?? 0}/10
                      </div>

                    </div>

                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">

                      <p className="text-xs text-green-600 font-semibold mb-1">
                        AI Feedback
                      </p>

                      <p className="text-sm text-gray-700 leading-relaxed">
                        {q.feedback &&
                        q.feedback.trim() !== ""
                          ? q.feedback
                          : "No feedback available for this question"}
                      </p>

                    </div>

                  </div>

                ))

              )}

            </div>

          </motion.div>

        </div>

      </div>
    </div>
  );
}

export default Step3Report;

