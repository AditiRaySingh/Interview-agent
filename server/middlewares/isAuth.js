import Jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(400).json({
                message: "User does not have a token"
            });
        }

        const verifyToken = Jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!verifyToken) {
            return res.status(400).json({
                message: "User does not have a valid token"
            });
        }

        req.userId = verifyToken.userId;

        next();

    } catch (error) {
        console.log("isAuth error:", error);

        return res.status(500).json({
            message: `isAuth error: ${error.message}`
        });
    }
};

export default isAuth;