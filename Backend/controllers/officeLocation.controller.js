const pool= require("../config/db");


// Why: Fetch the office location (lat, lng, allowed_radius) for the employee's branch.
// This is used by frontend's haversine formula to check if employee is within 500m.
async function bypassOfficeLocationRadius(req, res) {
  try {
    const { employeeId } = req.params;

    const [employees] = await pool.query(
      `SELECT branch_id FROM employee_master WHERE id = ?`,
      [employeeId],
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const branchId = employees[0].branch_id;

    const [locations] = await pool.query(
      `SELECT * FROM office_locations WHERE branch_id = ? LIMIT 1`,
      [branchId],
    );

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No office location mapped to your branch",
      });
    }

    return res.json({
      success: true,
      officeLocation: locations[0],
    });
  } catch (err) {
    console.error("Office Location Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } 
}


module.exports={
    bypassOfficeLocationRadius
}
