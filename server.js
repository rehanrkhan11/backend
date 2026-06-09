require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ─── 1. CORS Configuration (Must be absolutely first) ──────
const allowedOrigins = [
  "https://frontend-phi-eight-17.vercel.app",
  "http://localhost:5173"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Vercel serverless functions sometimes pass undefined origin for certain preflights
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200 // Forces 200 OK for legacy browsers on OPTIONS
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ─── 2. Standard Parsers ────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── 3. Database Connection Middleware (CRITICAL: Move this BEFORE routes) ───
let isConnected = false;

const connectToMongoDB = async () => {
  if (isConnected) return;

  try {
    // Note: Mongoose v6+ does not need useNewUrlParser or useUnifiedTopology options
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error; // Throw so it hits the global error handler safely
  }
};

app.use(async (req, res, next) => {
  try {
    await connectToMongoDB();
    next();
  } catch (err) {
    next(err);
  }
});

// ─── 4. Health Check Route ─────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Doctor Appointment API is running",
  });
});

// ─── 5. App Routes ───────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const userRoutes = require("./routes/userRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chatbot", chatbotRoutes);

// ─── 6. 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ─── 7. Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
