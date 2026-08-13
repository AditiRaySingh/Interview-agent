import Jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        message: "User is not authenticated",
      });
    }

    const verifyToken = Jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!verifyToken) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    req.userId = verifyToken.userId;

    next();

  } catch (error) {
    console.log("isAuth error:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default isAuth;
