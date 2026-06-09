// controllers/medicalRecordController.js
// ─────────────────────────────────────────────────────────────
// CRUD for medical records - only doctors can create/update
// ─────────────────────────────────────────────────────────────

const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");

// ── @GET /api/medical-records ───────────────────────────────
// Patient: gets their own records
// Doctor: gets all records they created
const getMedicalRecords = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "patient") {
      query.patient = req.user._id;
    } else {
      query.doctor = req.user._id;
    }

    // Allow doctor to get a specific patient's records
    if (req.user.role === "doctor" && req.query.patientId) {
      query.patient = req.query.patientId;
    }

    const records = await MedicalRecord.find(query)
      .populate("patient", "name email phone bloodGroup dateOfBirth")
      .populate("doctor", "name specialization")
      .populate("appointment", "date time reason")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error("Get records error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── @GET /api/medical-records/:id ──────────────────────────
const getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate("patient", "name email phone bloodGroup allergies")
      .populate("doctor", "name specialization")
      .populate("appointment");

    if (!record) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    // Only the involved patient or doctor can view this record
    const canView =
      record.patient._id.toString() === req.user._id.toString() ||
      record.doctor._id.toString() === req.user._id.toString();

    if (!canView) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── @POST /api/medical-records ──────────────────────────────
// Only doctors can create medical records
const createMedicalRecord = async (req, res) => {
  try {
    const { appointmentId, patientId, diagnosis, symptoms, notes, prescriptions, followUpDate } =
      req.body;

    // Validate that the appointment belongs to this doctor
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      if (appointment.doctor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not your appointment" });
      }

      // Auto-complete the appointment when a record is created
      appointment.status = "completed";
      await appointment.save();
    }

    const record = await MedicalRecord.create({
      appointment: appointmentId || undefined,
      patient: patientId,
      doctor: req.user._id,
      diagnosis,
      symptoms: symptoms || [],
      notes,
      prescriptions: prescriptions || [],
      followUpDate: followUpDate || null,
    });

    await record.populate("patient", "name email");
    await record.populate("doctor", "name specialization");

    res.status(201).json(record);
  } catch (error) {
    console.error("Create record error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── @PUT /api/medical-records/:id ──────────────────────────
// Doctor updates an existing record (e.g., follow-up notes)
// TODO: Add audit trail for record edits in production
const updateMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Only the doctor who created it can update
    if (record.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this record" });
    }

    const updated = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "name email")
      .populate("doctor", "name specialization");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
};
