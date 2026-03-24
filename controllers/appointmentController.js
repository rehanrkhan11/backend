// controllers/appointmentController.js
// ─────────────────────────────────────────────────────────────
// CRUD operations for appointments
// ─────────────────────────────────────────────────────────────

const Appointment = require("../models/Appointment");
const User = require("../models/User");

// ── @GET /api/appointments ──────────────────────────────────
// Patient: gets own appointments
// Doctor: gets own appointments
const getMyAppointments = async (req, res) => {
  try {
    const { status, upcoming } = req.query;

    let query = {};

    // Filter by role
    if (req.user.role === "patient") {
      query.patient = req.user._id;
    } else {
      query.doctor = req.user._id;
    }

    // Optional filters
    if (status) query.status = status;

    // Only return future/today appointments if upcoming=true
    if (upcoming === "true") {
      query.date = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "name email phone profileImage")
      .populate("doctor", "name email specialization profileImage")
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── @POST /api/appointments ─────────────────────────────────
// Patient books a new appointment with a doctor
const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    // Validate doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // TODO: Check if the time slot is already booked for this doctor on this date
    // const conflict = await Appointment.findOne({
    //   doctor: doctorId, date: new Date(date), time, status: "scheduled"
    // });
    // if (conflict) return res.status(400).json({ message: "Time slot not available" });

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date: new Date(date),
      time,
      reason,
      status: "scheduled",
    });

    // Populate doctor and patient info before returning
    await appointment.populate("doctor", "name specialization email");
    await appointment.populate("patient", "name email");

    // TODO: Send confirmation email/SMS to patient and doctor
    // await sendEmail({ to: req.user.email, subject: "Appointment Confirmed", ... });

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── @PATCH /api/appointments/:id/status ────────────────────
// Doctor: marks as completed or cancelled
// Patient: can cancel
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Authorization check: only the patient or doctor involved can update
    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isDoctor = appointment.doctor.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: "Not authorized to update this appointment" });
    }

    // Patients can only cancel, not complete
    if (req.user.role === "patient" && status !== "cancelled") {
      return res.status(403).json({ message: "Patients can only cancel appointments" });
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── @DELETE /api/appointments/:id ──────────────────────────
// TODO: Decide on hard delete vs soft delete (status = "cancelled" is preferred)
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only allow the patient who created it to delete
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await appointment.deleteOne();
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMyAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
};
