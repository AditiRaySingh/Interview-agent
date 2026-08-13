import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import { useDispatch } from "react-redux";

import { ServerUrl } from "../App";
import { setUserData } from "../redux/userSlice";

function Pricing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [selectedPlan, setSelectedPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // ==========================================
  // LOAD RAZORPAY
  // ==========================================

  useEffect(() => {
    const loadRazorpay = () => {
      if (typeof window.Razorpay === "function") {
        console.log("✅ Razorpay already loaded");
        setRazorpayLoaded(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", handleScriptLoad);

        return () => {
          existingScript.removeEventListener(
            "load",
            handleScriptLoad
          );
        };
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      script.onload = handleScriptLoad;

      script.onerror = () => {
        console.error("❌ Failed to load Razorpay script");
        setRazorpayLoaded(false);
      };

      document.body.appendChild(script);

      function handleScriptLoad() {
        if (typeof window.Razorpay === "function") {
          console.log("✅ Razorpay loaded successfully");
          setRazorpayLoaded(true);
        } else {
          console.error(
            "❌ Razorpay script loaded but Razorpay is unavailable"
          );
          setRazorpayLoaded(false);
        }
      }
    };

    loadRazorpay();
  }, []);

  // ==========================================
  // PLANS
  // ==========================================

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      credits: 100,
      description:
        "Perfect for beginners starting interview preparation.",
      features: [
        "100 AI Interview Credits",
        "Basic Performance Report",
        "Voice Interview Access",
        "Limited History Tracking",
      ],
      default: true,
    },
    {
      id: "basic",
      name: "Starter Pack",
      price: "₹100",
      credits: 150,
      description:
        "Great for focused practice and skill improvement.",
      features: [
        "150 AI Interview Credits",
        "Detailed Feedback",
        "Performance Analytics",
        "Full Interview History",
      ],
    },
    {
      id: "pro",
      name: "Pro Pack",
      price: "₹500",
      credits: 650,
      description:
        "Best value for serious interview preparation.",
      features: [
        "650 AI Interview Credits",
        "Advanced AI Feedback",
        "Skill Trend Analysis",
        "Priority AI Processing",
      ],
      badge: "Best Value",
    },
  ];

  // ==========================================
  // HANDLE PAYMENT
  // ==========================================

  const handlePayment = async (plan) => {
    try {
      setLoadingPlan(plan.id);

      // ========================================
      // 1. CHECK RAZORPAY
      // ========================================

      if (!razorpayLoaded) {
        console.log("⚠️ Razorpay not ready, checking again...");

        if (typeof window.Razorpay !== "function") {
          alert(
            "Razorpay is not loaded. Please refresh the page and try again."
          );

          setLoadingPlan(null);
          return;
        }
      }

      if (typeof window.Razorpay !== "function") {
        console.error(
          "❌ Razorpay constructor unavailable:",
          window.Razorpay
        );

        alert(
          "Razorpay is not loaded. Please refresh the page."
        );

        setLoadingPlan(null);
        return;
      }

      console.log("✅ Razorpay constructor available");

      // ========================================
      // 2. CREATE ORDER
      // ========================================

      console.log("🔥 Creating Razorpay order...");
      console.log("Plan:", plan.id);
      console.log("ServerUrl:", ServerUrl);

      const result = await axios.post(
        `${ServerUrl}/api/payment/order`,
        {
          planId: plan.id,
        },
        {
          withCredentials: true,
        }
      );

      console.log(
        "✅ Order response:",
        result.data
      );

      // ========================================
      // 3. CHECK ORDER
      // ========================================

      if (!result.data || !result.data.id) {
        console.error(
          "❌ Invalid Razorpay order:",
          result.data
        );

        alert(
          "Invalid payment order received from server."
        );

        setLoadingPlan(null);
        return;
      }

      // ========================================
      // 4. RAZORPAY KEY
      // ========================================

      const razorpayKey =
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        console.error(
          "❌ VITE_RAZORPAY_KEY_ID is missing"
        );

        alert(
          "Razorpay Key ID is missing. Check frontend .env."
        );

        setLoadingPlan(null);
        return;
      }

      console.log(
        "✅ Razorpay Key:",
        razorpayKey
      );

      // ========================================
      // 5. CHECK ORDER AMOUNT
      // ========================================

      console.log(
        "✅ Razorpay order ID:",
        result.data.id
      );

      console.log(
        "✅ Razorpay amount:",
        result.data.amount
      );

      // ========================================
      // 6. RAZORPAY OPTIONS
      // ========================================

      const options = {
        key: razorpayKey,

        amount: result.data.amount,

        currency: result.data.currency || "INR",

        name: "InterviewIQ.AI",

        description: `${plan.name} - ${plan.credits} Credits`,

        order_id: result.data.id,

        handler: async function (response) {
          console.log(
            "✅ Razorpay payment response:",
            response
          );

          try {
            // ==================================
            // VERIFY PAYMENT
            // ==================================

            console.log(
              "🔥 Sending payment verification..."
            );

            const verifyResponse = await axios.post(
              `${ServerUrl}/api/payment/verify`,
              {
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,
              },
              {
                withCredentials: true,
              }
            );

            console.log(
              "✅ Payment verification response:",
              verifyResponse.data
            );

            // ==================================
            // UPDATE REDUX
            // ==================================

            if (verifyResponse.data.user) {
              dispatch(
                setUserData(
                  verifyResponse.data.user
                )
              );
            }

            alert(
              "✅ Payment Successful! Credits Added!"
            );

            navigate("/");
          } catch (error) {
            console.error(
              "❌ Payment verification failed:",
              error
            );

            console.error(
              "Backend response:",
              error.response?.data
            );

            alert(
              "Payment verification failed. If money was deducted, please contact support."
            );
          } finally {
            setLoadingPlan(null);
          }
        },

        theme: {
          color: "#10b981",
        },

        modal: {
          ondismiss: function () {
            console.log(
              "⚠️ Razorpay payment popup closed"
            );

            setLoadingPlan(null);
          },
        },
      };

      // ========================================
      // 7. CREATE RAZORPAY INSTANCE
      // ========================================

      console.log(
        "🔥 Creating Razorpay instance..."
      );

      const razorpay =
        new window.Razorpay(options);

      console.log(
        "✅ Razorpay instance created"
      );

      // ========================================
      // 8. ERROR EVENTS
      // ========================================

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "❌ Razorpay payment failed:",
            response
          );

          console.error(
            "Error code:",
            response.error?.code
          );

          console.error(
            "Error description:",
            response.error?.description
          );

          console.error(
            "Error reason:",
            response.error?.reason
          );

          alert(
            response.error?.description ||
              "Payment failed."
          );

          setLoadingPlan(null);
        }
      );

      // ========================================
      // 9. OPEN CHECKOUT
      // ========================================

      try {
        console.log(
          "🔥 BEFORE razorpay.open()"
        );

        razorpay.open();

        console.log(
          "🔥 AFTER razorpay.open()"
        );
      } catch (openError) {
        console.error(
          "❌ razorpay.open() ERROR:",
          openError
        );

        alert(
          "Unable to open Razorpay payment window."
        );

        setLoadingPlan(null);
      }
    } catch (error) {
      console.error(
        "❌ Payment order error:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      console.error(
        "Backend status:",
        error.response?.status
      );

      alert(
        error.response?.data?.message ||
          "Unable to create payment order."
      );

      setLoadingPlan(null);
    }
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-16 px-6">
      {/* HEADER */}

      <div className="max-w-6xl mx-auto mb-14 flex items-start gap-4">
        <button
          onClick={() => navigate("/")}
          className="mt-2 p-3 rounded-full bg-white shadow hover:shadow-md transition"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>

        <div className="text-center w-full">
          <h1 className="text-4xl font-bold text-gray-800">
            Choose Your Plan
          </h1>

          <p className="text-gray-500 mt-3 text-lg">
            Flexible pricing to match your interview
            preparation goals.
          </p>
        </div>
      </div>

      {/* PLANS */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isSelected =
            selectedPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              whileHover={
                !plan.default
                  ? { scale: 1.05 }
                  : undefined
              }
              onClick={() => {
                if (!plan.default) {
                  setSelectedPlan(plan.id);
                }
              }}
              className={`relative rounded-3xl p-8 transition-all duration-300 border ${
                isSelected
                  ? "border-emerald-600 shadow-2xl bg-white"
                  : "border-gray-200 bg-white shadow-md"
              } ${
                plan.default
                  ? "cursor-default"
                  : "cursor-pointer"
              }`}
            >
              {/* BADGE */}

              {plan.badge && (
                <div className="absolute top-6 right-6 bg-emerald-600 text-white text-xs px-4 py-1 rounded-full shadow">
                  {plan.badge}
                </div>
              )}

              {plan.default && (
                <div className="absolute top-6 right-6 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                  Default
                </div>
              )}

              {/* PLAN NAME */}

              <h3 className="text-xl font-semibold text-gray-800">
                {plan.name}
              </h3>

              {/* PRICE */}

              <div className="mt-4">
                <span className="text-3xl font-bold text-emerald-600">
                  {plan.price}
                </span>

                <p className="text-gray-500 mt-1">
                  {plan.credits} Credits
                </p>
              </div>

              {/* DESCRIPTION */}

              <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                {plan.description}
              </p>

              {/* FEATURES */}

              <div className="mt-6 space-y-3 text-left">
                {plan.features.map(
                  (feature, index) => (
                    <div
                      key={`${plan.id}-${index}`}
                      className="flex items-center gap-3"
                    >
                      <FaCheckCircle className="text-emerald-500 text-sm" />

                      <span className="text-gray-700 text-sm">
                        {feature}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* PAYMENT BUTTON */}

              {!plan.default && (
                <button
                  disabled={
                    loadingPlan === plan.id
                  }
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!isSelected) {
                      setSelectedPlan(plan.id);
                      return;
                    }

                    handlePayment(plan);
                  }}
                  className={`w-full mt-8 py-3 rounded-xl font-semibold transition ${
                    isSelected
                      ? "bg-emerald-600 text-white hover:opacity-90"
                      : "bg-gray-100 text-gray-700 hover:bg-emerald-50"
                  }`}
                >
                  {loadingPlan === plan.id
                    ? "Processing..."
                    : isSelected
                    ? "Proceed to Pay"
                    : "Select Plan"}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Pricing;