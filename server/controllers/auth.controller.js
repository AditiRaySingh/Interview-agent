import User from "../models/user.model.js";
import genToken from "../config/token.js";

export const googleAuth = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
     console.log("✅ googleAuth route called");

    const { name, email } = req.body;

    let user = await User.findOne({ email });
    console.log("Existing User:", user);

    if (!user) {
      user = await User.create({ name, email });
      console.log("New User Created:", user);
    }

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(user);

  } catch (error) {
    console.log("Controller Error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      message: "Logout successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: `logout error ${error.message}`,
    });
  }
};
