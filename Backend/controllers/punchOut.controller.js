const pool= require("../config/db");

async function punchOut(req, res) {
  try {
    const { employee_id, latitude, longitude } = req.body;

    if (!employee_id) {
      return res
        .status(400)
        .json({ success: false, message: "Employee ID required" });
    }

    // Find today's attendance record
    const [existing] = await promisePool.query(
      `SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = CURDATE()`,
      [employee_id],
    );

    if (existing.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No punch in found for today" });
    }

    if (existing[0].punch_out) {
      return res
        .status(400)
        .json({ success: false, message: "Already punched out today" });
    }

    let selfiePath = null;
    if (req.file) {
      selfiePath = `/uploads/${req.file.filename}`;
    }

    await promisePool.query(
      `UPDATE attendance
       SET punch_out = CURTIME(),
           punch_out_selfie = COALESCE(?, punch_out_selfie),
           punch_out_latitude = ?,
           punch_out_longitude = ?
       WHERE id = ?`,
      [selfiePath, latitude || null, longitude || null, existing[0].id],
    );

    return res.json({
      success: true,
      message: "Punch Out Successful",
    });
  } catch (err) {
    console.error("Punch Out Error:", err);
    if (req.file?.path) {
      const fs = require("fs");
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports={
    punchOut
}