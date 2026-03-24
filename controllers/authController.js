const jwt = require("jsonwebtoken");
const User = require("../models/User");
const connectDB = require("../config/db"); // 1. Import your connection utility

// ── Helper: Generate JWT ────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ── @POST /api/auth/register ────────────────────────────────
const register = async (req, res) => {
  try {
    await connectDB(); // 2. Critical: Wait for DB before any Model query

    const { name, email, password, role, phone, specialization } = req.body;

    // Now this query won't time out
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // ... (rest of your validation logic)

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
    await connectDB(); // 3. Also add here for the login route

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

// ... Apply the same await connectDB() to getMe if needed
const getMe = async (req, res) => {
  try {
    await connectDB(); // Stay safe for serverless!
    // req.user is usually set by your 'protect' middleware
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
