import razorpay from "../services/razorpay.service.js";
import crypto from "crypto";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";

// ==========================================
// PLANS
// ==========================================

const plans = {
  basic: {
    amount: 100,
    credits: 150,
  },

  pro: {
    amount: 500,
    credits: 650,
  },
};

// ==========================================
// CREATE ORDER
// ==========================================

export const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    console.log(
      "🔥 Create order request:",
      planId
    );

    const plan = plans[planId];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    const options = {
      amount: plan.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log(
      "🔥 Creating Razorpay order:",
      options
    );

    const order =
      await razorpay.orders.create(options);

    console.log(
      "✅ Razorpay order created:",
      order.id
    );

    await Payment.create({
      userId: req.userId,
      planId: planId,
      amount: plan.amount,
      credits: plan.credits,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(200).json(order);
  } catch (error) {
    console.error(
      "❌ Create order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

// ==========================================
// VERIFY PAYMENT
// ==========================================

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    console.log(
      "🔥 Verify payment request:",
      {
        razorpay_order_id,
        razorpay_payment_id,
      }
    );

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are missing",
      });
    }

    // Find payment belonging to current user
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Already paid
    if (payment.status === "paid") {
      const user = await User.findById(
        payment.userId
      );

      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        user,
      });
    }

    // ========================================
    // SIGNATURE
    // ========================================

    const body =
      payment.razorpayOrderId +
      "|" +
      razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    console.log(
      "🔥 Signature generated"
    );

    if (
      expectedSignature !==
      razorpay_signature
    ) {
      console.error(
        "❌ Invalid Razorpay signature"
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // ========================================
    // UPDATE PAYMENT
    // ========================================

    payment.status = "paid";
    payment.razorpayPaymentId =
      razorpay_payment_id;

    await payment.save();

    console.log(
      "✅ Payment marked as paid"
    );

    // ========================================
    // ADD CREDITS
    // ========================================

    const updatedUser =
      await User.findByIdAndUpdate(
        payment.userId,
        {
          $inc: {
            credits: payment.credits,
          },
        },
        {
          new: true,
        }
      );

    console.log(
      "✅ Credits added:",
      payment.credits
    );

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and credits added",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "❌ Verify payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};