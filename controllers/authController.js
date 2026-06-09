const jwt = require("jsonwebtoken");
const User = require("../models/User");
const connectDB = require("../config/db");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    await connectDB(); // Critical for serverless
    const { name, email, password, role, phone, specialization } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password, role, phone, specialization });
    const token = generateToken(user._id);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Login error" });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// This line must include all three to match your routes
module.exports = { register, login, getMe };
