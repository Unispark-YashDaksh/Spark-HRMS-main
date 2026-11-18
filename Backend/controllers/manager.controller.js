const pool= require("../config/db");


// ============================================
// GET /pending-approvals/:managerId
// Why: Returns all pending WFH + Leave requests from employees
//      whose reporting_manager_id matches the given manager.
// Flow: Manager opens Approvals screen → app calls this endpoint →
//       backend queries both work_from_home_requests and
//       leave_applications where status = 'PENDING' and the
//       employee's reporting_manager = this manager.
// Returns: Array of requests with a "type" field ('WFH' or 'LEAVE')
// ============================================
async function pendingApprovalsByManager(req, res) {
try {
    const { managerId } = req.params;

    // Fetch pending WFH requests from subordinates
    const [wfhRequests] = await pool.query(
      `SELECT wfr.id, wfr.employee_id, wfr.start_date, wfr.end_date,
              wfr.reason, wfr.status, wfr.created_at,
              em.employee_name, em.employee_code
       FROM work_from_home_requests wfr
       JOIN employee_master em ON em.id = wfr.employee_id
       WHERE em.reporting_manager_id = ?
         AND wfr.status = 'PENDING'
       ORDER BY wfr.created_at DESC`,
      [managerId],
    );

    // Fetch pending Leave requests from subordinates
    const [leaveRequests] = await pool.query(
      `SELECT la.id, la.employee_id, la.from_date AS start_date,
              la.to_date AS end_date, la.reason, la.status, la.created_at,
              em.employee_name, em.employee_code,
              lt.leave_name AS leave_type_name
       FROM leave_applications la
       JOIN employee_master em ON em.id = la.employee_id
       JOIN leave_types lt ON lt.id = la.leave_type_id
       WHERE em.reporting_manager_id = ?
         AND la.status = 'PENDING'
       ORDER BY la.created_at DESC`,
      [managerId],
    );

    // Tag each request with its type so frontend can distinguish them
    const taggedWfh = wfhRequests.map((r) => ({ ...r, requestType: "WFH" }));
    const taggedLeave = leaveRequests.map((r) => ({
      ...r,
      requestType: "LEAVE",
    }));

    // Combine both arrays into a single response
    const allPending = [...taggedWfh, ...taggedLeave];

    // Sort by created_at descending (newest first)
    allPending.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      count: allPending.length,
      requests: allPending,
    });
  } catch (err) {
    console.error("Pending Approvals Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}


// ============================================
// PUT /wfh-request/:id/approve
// Why: Manager approves or rejects a WFH request.
// Body: { status: "APPROVED" | "REJECTED", approved_by: <manager_employee_id> }
// Flow: Frontend sends status + manager's ID → backend verifies
//       the manager IS the reporting manager of the requesting employee →
//       updates the request status, approved_by, and approved_on.
// ============================================
async function updateWfhRequestsById(req, res) {
  try {
    const { id } = req.params;
    const { status, approved_by } = req.body; // "APPROVED" or "REJECTED"

    // ---- Validate status ----
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be APPROVED or REJECTED",
      });
    }

    // ---- Validate approved_by ----
    if (!approved_by) {
      return res.status(400).json({
        success: false,
        error: "approved_by (manager employee ID) is required",
      });
    }

    // ---- Fetch the WFH request along with the employee's reporting manager ----
    const [requests] = await pool.query(
      `SELECT wfr.*, em.reporting_manager_id, em.employee_name AS employee_name
       FROM work_from_home_requests wfr
       JOIN employee_master em ON em.id = wfr.employee_id
       WHERE wfr.id = ?`,
      [id],
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        error: "WFH request not found",
      });
    }

    const request = requests[0];

    // ---- Check if already processed ----
    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: `This request is already ${request.status.toLowerCase()}`,
      });
    }

    // ---- Hierarchy check: only the reporting manager can approve ----
    if (request.reporting_manager_id !== parseInt(approved_by)) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to approve this request",
      });
    }

    // ---- Update the request ----
    await pool.query(
      `UPDATE work_from_home_requests
       SET status = ?, approved_by = ?, approved_on = NOW()
       WHERE id = ?`,
      [status, approved_by, id],
    );

    // ---- Fetch the updated record to return ----
    const [updated] = await pool.query(
      `SELECT wfr.*, em.employee_name, ap.employee_name AS approved_by_name
       FROM work_from_home_requests wfr
       JOIN employee_master em ON em.id = wfr.employee_id
       LEFT JOIN employee_master ap ON ap.id = wfr.approved_by
       WHERE wfr.id = ?`,
      [id],
    );

    return res.json({
      success: true,
      message: `WFH request ${status.toLowerCase()} successfully`,
      data: updated[0],
    });
  } catch (err) {
    console.error("WFH Approve Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports={
pendingApprovalsByManager,
updateWfhRequestsById
}