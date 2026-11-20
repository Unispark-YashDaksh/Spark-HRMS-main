const pool= require("../config/db");

// Why: The main Punch In API.
// Flow: Frontend validates everything (permissions, GPS, distance, selfie),
// then sends all data here for storage.
async function punchIn(req, res) {
  try {
    const {
      employee_id,
      latitude,
      longitude,
      readable_address,
      attendance_mode,
      office_location_id,
    } = req.body;

    // Validation
    if (!employee_id) {
      return res
        .status(400)
        .json({ success: false, message: "Employee ID required" });
    }
    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ success: false, message: "GPS coordinates required" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Selfie image required" });
    }

    // Double-check: ensure no duplicate punch in for today
    const [existing] = await pool.query(
      `SELECT * FROM attendance WHERE employee_id = ? AND attendance_date >= CURDATE() AND attendance_date < CURDATE() + INTERVAL 1 DAY`,
      [employee_id],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Already punched in today" });
    }
    const shiftSQL=  `SELECT s.start_time, s.late_after, s.half_day_after FROM employee_master e JOIN shift_master s ON e.shift_id= s.id WHERE e.id=?`
    const [shiftData]= await pool.query(shiftSQL, [employee_id]);
    if(shiftData.length===0){
      return res.status(400).json({
        success: false,
        message: "Shift not assigned to employee"
      })
    }

    const shift= shiftData[0];
    /*
     * Why: Determine if employee is late by comparing actual punch-in time
     * against the shift's late_after threshold (e.g. 09:15).
     * If punch-in > late_after → is_late=true, late_minutes = minutes past start_time.
     * If punch-in >= half_day_after → status = "HALF DAY".
     */
    let status= "PRESENT";
    let is_late= false;
    let late_minutes= 0;

    const punchInTime= new Date();
    if (shift.late_after) {
      const [lateHour, lateMinute]= shift.late_after.split(":");
      const lateThreshold= new Date();
      lateThreshold.setHours(parseInt(lateHour), parseInt(lateMinute), 0, 0);

      if (punchInTime > lateThreshold) {
        is_late= true;
        // Why: Store total minutes late relative to shift start (not late_after)
        // so admin can display "X hours Y minutes" or "Z mins late".
        if (shift.start_time) {
          const [startHour, startMinute]= shift.start_time.split(":");
          const shiftStart= new Date();
          shiftStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
          late_minutes= Math.round((punchInTime - shiftStart) / 60000);
        }
      }
    }

    // Why: If punch-in is at or after half_day_after time, mark as HALF DAY
    if (shift.half_day_after) {
      const [halfHour, halfMinute]= shift.half_day_after.split(":");
      const halfDayThreshold= new Date();
      halfDayThreshold.setHours(parseInt(halfHour), parseInt(halfMinute), 0, 0);

      if (punchInTime >= halfDayThreshold) {
        status= "HALF DAY";
      }
    }

    const selfiePath = req.file?.path || null;

    const [result] = await pool.query(
      `INSERT INTO attendance
       (employee_id, attendance_date, punch_in, punch_in_selfie, punch_in_latitude, punch_in_longitude, gps_location, attendance_mode, office_location_id, status, late_minutes, is_late)
       VALUES (?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        selfiePath,
        latitude,
        longitude,
        readable_address || "",
        attendance_mode || "OFFICE",
        office_location_id || null,
        status,
        late_minutes,
        is_late,
      ],
    );

    return res.json({
      success: true,
      message: "Punch In Successful",
      attendanceId: result.insertId,
    });
  } catch (err) {
    console.error("Punch In Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports={
    punchIn
}