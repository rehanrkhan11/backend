// models/User.js
// ─────────────────────────────────────────────────────────────
// Mongoose schema for both Patients and Doctors
// Role-based: "patient" | "doctor"
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      // TODO: Add custom email validation if needed
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      // TODO: Add phone number validation regex for your region
    },

    // ── Doctor-specific fields ──────────────────────────────
    specialization: {
      type: String,
      // TODO: Consider making this an enum of allowed specializations
      // e.g., ["Cardiologist", "Dermatologist", "General Physician", ...]
    },
    experience: {
      type: Number, // years of experience
      default: 0,
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    availableSlots: {
      // TODO: Extend this to a more complex schedule schema if needed
      type: [String],
      default: ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // ── Patient-specific fields ─────────────────────────────
    dateOfBirth: {
      type: Date,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    allergies: {
      type: [String],
      default: [],
    },

    // ── Profile ─────────────────────────────────────────────
    profileImage: {
      type: String,
      default: "", // TODO: Integrate with Cloudinary or S3 for image uploads
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// ── Hash password before saving ─────────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash if password has been modified
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare passwords ──────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
