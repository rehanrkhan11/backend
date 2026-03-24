const jwt = require("jsonwebtoken");
const User = require("../models/User");
const connectDB = require("../config/db"); 

// ── Helper: Generate JWT ────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ── @POST /api/auth/register ────────────────────────────────
const register = async (req, res) => {
  try {
    await connectDB(); 

    const { name, email, password, role, phone, specialization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Role validation
    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'patient' or 'doctor'" });
    }

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
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// ── @POST /api/auth/login ───────────────────────────────────
const login = async (req, res) => {
  try {
    await connectDB(); 

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

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
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ── @GET /api/auth/me ───────────────────────────────────────
const getMe = async (req, res) => {
  try {
    await connectDB(); 
    // Ensure the 'protect' middleware has run and populated req.user
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, getMe };
