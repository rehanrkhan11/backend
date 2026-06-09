// models/Appointment.js
// ─────────────────────────────────────────────────────────────
// Appointment schema linking a Patient and a Doctor
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    time: {
      type: String,
      required: [true, "Appointment time is required"],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    reason: {
      type: String,
      required: [true, "Reason for visit is required"],
      trim: true,
    },
    notes: {
      // Doctor's notes added when completing the appointment
      type: String,
      default: "",
    },
    // TODO: Add video call link field if you integrate telemedicine
    // meetingLink: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// ── Indexes for faster queries ───────────────────────────────
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: -1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
