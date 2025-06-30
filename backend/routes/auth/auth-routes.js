const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
  getUserProfile,
  updateUserProfile
} = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/check-auth", authMiddleware, (req, res) => {
  const user = req.user;
  const token = req.cookies.token;
  res.status(200).json({
    success: true,
    message: "User authenticated!",
    user,
    token: token
  });
});

router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);

module.exports = router;