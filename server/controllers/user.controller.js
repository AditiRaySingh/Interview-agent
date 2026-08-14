
import User from "../models/user.model.js"

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
<<<<<<< HEAD
=======

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User does not exist",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log("Get current user error:", error);

    return res.status(500).json({
      message: `Failed to get current user: ${error.message}`,
    });
  }
};
>>>>>>> 87a0ecd (some change)

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User does not exist",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log("Get current user error:", error);

    return res.status(500).json({
      message: `Failed to get current user: ${error.message}`,
    });
  }
};

export default getCurrentUser;
