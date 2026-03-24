// controllers/userController.js
// ─────────────────────────────────────────────────────────────
// User profile management + doctor/patient listing
// ─────────────────────────────────────────────────────────────

const User = require("../models/User");

// ── @GET /api/users/doctors ─────────────────────────────────
// Public: List all available doctors (for booking)
const getAllDoctors = async (req, res) => {
  try {
    const { specialization, search } = req.query;

    let query = { role: "doctor", isAvailable: true };

    // Filter by specialization
    if (specialization) {
      query.specialization = { $regex: specialization, $options: "i" };
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const doctors = await User.find(query).select(
      "name email specialization experience consultationFee availableSlots profileImage"
    );

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── @GET /api/users/patients ────────────────────────────────
// Doctor only: Get list of their patients
const getMyPatients = async (req, res) => {
  try {
    // TODO: Query this from appointments to get unique patients of this doctor
    // For now returns all patients; refine by cross-referencing appointments
    const patients = await User.find({ role: "patient" }).select(
      "name email phone bloodGroup dateOfBirth profileImage"
    );

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── @GET /api/users/profile ─────────────────────────────────
// Get current user's full profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── @PUT /api/users/profile ─────────────────────────────────
// Update current user's profile
// TODO: Add image upload handling (Multer + Cloudinary)
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ["name", "phone", "bloodGroup", "dateOfBirth", "allergies", "experience", "consultationFee", "availableSlots", "isAvailable"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Don't allow changing role or email through this route
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── @PUT /api/users/change-password ────────────────────────
// Change current user's password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will re-hash

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllDoctors, getMyPatients, getProfile, updateProfile, changePassword };
