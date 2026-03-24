// controllers/authController.js
// ─────────────────────────────────────────────────────────────
// Handles registration and login for both patients and doctors
// ─────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Helper: Generate JWT ────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d", // TODO: Adjust expiry; use refresh tokens for better security
  });
};

// ── @POST /api/auth/register ────────────────────────────────
// Register a new patient or doctor
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, specialization } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Validate role
    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'patient' or 'doctor'" });
    }

    // Doctors must provide a specialization
    if (role === "doctor" && !specialization) {
      return res.status(400).json({ message: "Doctors must provide a specialization" });
    }

    // Create user (password will be hashed by the pre-save hook in User model)
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      specialization: role === "doctor" ? specialization : undefined,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        specialization: user.specialization,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ── @POST /api/auth/login ───────────────────────────────────
// Login with email + password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        specialization: user.specialization,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ── @GET /api/auth/me ───────────────────────────────────────
// Get current logged-in user's profile
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, getMe };
