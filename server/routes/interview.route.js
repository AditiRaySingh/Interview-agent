import express from "express";

import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

import {
  analyzeResume,
  generateQuestion,
  submitAnswer,
  finishInterview,
  getInterviewReport,
  getMyInterviews,
} from "../controllers/interview.controller.js";

import {
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";

const interviewRouter = express.Router();


// ===============================
// INTERVIEW ROUTES
// ===============================

// Upload and analyze resume
interviewRouter.post(
  "/resume",
  isAuth,
  upload.single("resume"),
  analyzeResume
);

// Generate interview questions
interviewRouter.post(
  "/generate-questions",
  isAuth,
  generateQuestion
);

// Submit answer
interviewRouter.post(
  "/submit-answer",
  isAuth,
  submitAnswer
);

// Finish interview
interviewRouter.post(
  "/finish",
  isAuth,
  finishInterview
);

// Get user's interview history
interviewRouter.get(
  "/get-interview",
  isAuth,
  getMyInterviews
);

// Get one interview report
interviewRouter.get(
  "/report/:id",
  isAuth,
  getInterviewReport
);


// ===============================
// PAYMENT ROUTES
// ===============================

// Create Razorpay order
interviewRouter.post(
  "/pricing/order",
  isAuth,
  createOrder
);

// Verify Razorpay payment
interviewRouter.post(
  "/pricing/verify",
  isAuth,
  verifyPayment
);


export default interviewRouter;