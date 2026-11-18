const pool= require("../config/db");

// ============================================
// POST /wfh-request — Submit a Work From Home request
// Why: Employee applies for WFH from the mobile app.
// Body: { employee_id, start_date, end_date, reason }
// Flow: Validates fields → inserts into work_from_home_requests table → returns success
// ============================================
async function initiateWfhReq(req, res) {
  try {
    const { employee_id, start_date, end_date, reason } = req.body;

    // ---- Validation ----
    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: "employee_id, start_date, and end_date are required",
      });
    }

    // Insert the WFH request with status = 'PENDING' by default
    const [result] = await pool.query(
      `INSERT INTO work_from_home_requests (employee_id, start_date, end_date, reason)
       VALUES (?, ?, ?, ?)`,
      [employee_id, start_date, end_date, reason || null],
    );

    return res.status(201).json({
      success: true,
      message: "WFH request submitted successfully",
      requestId: result.insertId,
    });
  } catch (err) {
    console.error("WFH Request Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}


// Why: Check if employee is approved for WFH today.
// If approved → skip 500m geo-fencing validation.
async function getwfhStatusbyEmployeeId(req, res) {
  try {
    const { employeeId } = req.params;

    const [requests] = await pool.query(
      `SELECT * FROM work_from_home_requests
       WHERE employee_id = ? AND status = 'APPROVED'
       AND CURDATE() BETWEEN start_date AND end_date
       LIMIT 1`,
      [employeeId],
    );

    return res.json({
      success: true,
      isWFH: requests.length > 0,
    });
  } catch (err) {
    console.error("WFH Status Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
module.exports={
initiateWfhReq,
getwfhStatusbyEmployeeId
}
