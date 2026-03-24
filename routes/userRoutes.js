// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  getMyPatients,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public: anyone can list doctors (for booking page)
router.get("/doctors", getAllDoctors);

// Protected routes
router.use(protect);

// GET /api/users/profile
// PUT /api/users/profile
router.route("/profile").get(getProfile).put(updateProfile);

// PUT /api/users/change-password
router.put("/change-password", changePassword);

// GET /api/users/patients  (doctor only)
router.get("/patients", authorize("doctor"), getMyPatients);

module.exports = router;
