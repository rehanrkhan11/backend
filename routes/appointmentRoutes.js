// routes/appointmentRoutes.js
const express = require("express");
const router = express.Router();
const {
  getMyAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All appointment routes require auth
router.use(protect);

// GET /api/appointments          - get my appointments (patient or doctor)
// POST /api/appointments         - patient books appointment
router.route("/").get(getMyAppointments).post(authorize("patient"), createAppointment);

// PATCH /api/appointments/:id/status  - update status
router.patch("/:id/status", updateAppointmentStatus);

// DELETE /api/appointments/:id   - patient deletes their own appointment
router.delete("/:id", authorize("patient"), deleteAppointment);

module.exports = router;
