// routes/medicalRecordRoutes.js
const express = require("express");
const router = express.Router();
const {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
} = require("../controllers/medicalRecordController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// GET /api/medical-records           - get my records
// POST /api/medical-records          - doctor creates record
router
  .route("/")
  .get(getMedicalRecords)
  .post(authorize("doctor"), createMedicalRecord);

// GET /api/medical-records/:id       - get single record
// PUT /api/medical-records/:id       - doctor updates record
router
  .route("/:id")
  .get(getMedicalRecordById)
  .put(authorize("doctor"), updateMedicalRecord);

module.exports = router;
