// models/MedicalRecord.js
// ─────────────────────────────────────────────────────────────
// Medical record created by a doctor after completing an appointment
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

// Sub-schema for prescriptions
const prescriptionSchema = new mongoose.Schema(
  {
    medication: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true, // e.g., "500mg"
    },
    frequency: {
      type: String,
      required: true,
      trim: true, // e.g., "Twice daily"
    },
    duration: {
      type: String,
      required: true,
      trim: true, // e.g., "7 days"
    },
    instructions: {
      type: String,
      default: "", // TODO: Add "take with food", "avoid alcohol" etc.
    },
  },
  { _id: true }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      // TODO: Make required once you implement the flow of creating
      // medical records directly from appointments
    },
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
      default: Date.now,
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
    },
    symptoms: {
      type: [String],
      default: [],
      // TODO: Use a standardized symptom list (ICD-10 codes) in production
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    prescriptions: {
      type: [prescriptionSchema],
      default: [],
    },
    followUpDate: {
      type: Date,
      default: null,
      // TODO: Trigger notification to patient for follow-up reminder
    },
    attachments: {
      type: [String],
      default: [],
      // TODO: Store Cloudinary/S3 URLs for uploaded lab reports, X-rays etc.
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster patient history queries
medicalRecordSchema.index({ patient: 1, date: -1 });
medicalRecordSchema.index({ doctor: 1, date: -1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
