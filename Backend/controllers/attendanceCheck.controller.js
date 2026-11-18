const pool= require("../config/db");

// Why: On screen load, frontend calls this to know TODAY's state.
// Backend checks: has employee punched in? punched out?
// Returns canPunchIn / canPunchOut so frontend shows correct button.
async function attendance(req, res) {
    try {
        const employeeId = req.body.employee_id;
        if (!employeeId) {
            return res.status(400).json({
                success: false, 
                message: "Employee ID Missing" 
            });
        }

    

    // Also use promisePool.query for async/await
    const [result] = await promisePool.query(
      `SELECT * FROM attendance WHERE employee_id = ? AND attendance_date >= CURDATE() AND attendance_date < CURDATE() + INTERVAL 1 DAY ORDER BY id DESC LIMIT 1`,
      [employeeId],
    );

    if (result.length === 0) {
      return res.json({
        canPunchIn: true,
        canPunchOut: false,
        message: "Allow Punch In",
        record: null,
      });
    }

    const record = result[0];
    // Format times for frontend display (HH:MM AM/PM)
    const formatTime = (t) => {
      if (!t) return null;
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    if (record.punch_in && !record.punch_out) {
      return res.json({
        canPunchIn: false,
        canPunchOut: true,
        message: "Allow Punch Out",
        record: {
          punch_in: formatTime(record.punch_in),
          punch_out: null,
          punch_in_selfie: record.punch_in_selfie,
          gps_location: record.gps_location,
          attendance_mode: record.attendance_mode,
          readable_address: record.gps_location,
        },
      });
    }
    if (record.punch_in && record.punch_out) {
      return res.json({
        canPunchIn: false,
        canPunchOut: false,
        message: "Attendance Completed",
        record: {
          punch_in: formatTime(record.punch_in),
          punch_out: formatTime(record.punch_out),
          punch_in_selfie: record.punch_in_selfie,
          punch_out_selfie: record.punch_out_selfie,
          gps_location: record.gps_location,
          attendance_mode: record.attendance_mode,
          readable_address: record.gps_location,
        },
      });
    }

    return res.json({
      canPunchIn: true,
      canPunchOut: false,
      message: "Allow Punch In",
      record: null,
    });
  } catch (err) {
    console.error("Attendance API Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function fetchAttendance(req, res) {
    try {
      const [rows] = await pool.query(`SELECT a.*, e.employee_name, e.employee_code, ds.designation_name, d.department_name FROM attendance a
    LEFT JOIN employee_master e ON a.employee_id= e.id
    LEFT JOIN designations ds ON e.designation_id= ds.id
    LEFT JOIN departments d ON e.department_id= d.id
    `);
  
      const formattedRows = rows.map((row) => ({
        ...row,
        attendance_date: row.attendance_date
          ? row.attendance_date.toLocaleDateString("en-CA")
          : null,
      }));
      // only for debugging purpose-- rows are coming or not and correct data coming from db.
      console.log(formattedRows);
      return res.json({
        success: true,
        message: "Attendance Fetch Successfully",
        result: formattedRows,
      });
    } catch (error) {
      console.log("Ftech Attendance API Error:---->", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch attendance",
        error: error.message,
      });
    }
}

// ============================================
// GET /attendance/:employeeId/:month/:year — monthly attendance dates for calendar dots
// ============================================
async function fetchMonthlyAttendanceDates(req, res) {
  const { employeeId, month, year } = req.params;
  try {
    // Fetch distinct attendance dates for the given employee in the given month/year
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const [rows] = await pool.query(
      `SELECT DISTINCT DAY(attendance_date) AS day 
       FROM attendance 
       WHERE employee_id = ? 
         AND attendance_date >= ? 
         AND attendance_date < DATE_ADD(?, INTERVAL 1 MONTH)`,
      [employeeId, monthStart, monthStart]
    );
    // Fetch joining date to avoid marking dates before joining as absent
    const [empRows] = await pool.query(
      `SELECT employee_joining_date FROM employee_master WHERE id = ?`,
      [employeeId]
    );
    const joiningDate = empRows.length > 0 ? empRows[0].employee_joining_date : null;
    // Extract just the day numbers (e.g., [1, 3, 5, ...])
    const dates = rows.map((r) => r.day);
    // Format joining date manually (YYYY-MM-DD) to avoid toISOString timezone shift
    let joiningDateStr = null;
    if (joiningDate) {
      const dt = new Date(joiningDate);
      joiningDateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    }
    res.json({
      success: true,
      dates,
      joiningDate: joiningDateStr,
    });
  } catch (error) {
    console.log("Monthly Attendance Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}


// ============================================
// GET /attendance/report/:employeeId/:month/:year — detailed monthly report for admin
// Returns attendance records for the given month. Only past dates (up to today)
// are included — future dates are excluded to avoid misleading "absent" entries.
// Date keys are formatted manually (YYYY-MM-DD) to avoid the timezone shift bug
// where toISOString() converts local midnight to previous-day UTC.
// ============================================


async function fetchMonthlyAttendanceReport(req, res) {
  const { employeeId, month, year } = req.params;
  try {
    // 1. Get employee info
    const [empRows] = await pool.query(
      `SELECT id, employee_name, employee_code FROM employee_master WHERE id = ?`,
      [employeeId]
    );
    if (empRows.length === 0) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }
    const employee = empRows[0];

    // 2. Get all attendance records for this employee in the given month
    const [attRows] = await pool.query(
      `SELECT attendance_date, punch_in, punch_out, gps_location, status
       FROM attendance 
       WHERE employee_id = ? 
         AND MONTH(attendance_date) = ? 
         AND YEAR(attendance_date) = ?
       ORDER BY attendance_date ASC`,
      [employeeId, parseInt(month), parseInt(year)]
    );

    // 3. Get all holidays in this month
    const [holRows] = await pool.query(
      `SELECT holiday_date, holiday_name FROM holidays
       WHERE MONTH(holiday_date) = ? AND YEAR(holiday_date) = ?`,
      [parseInt(month), parseInt(year)]
    );

    // 3b. Get approved leave applications for this employee overlapping the month
    // Used to show leave reason in the report when attendance status is "leave".
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = `${year}-${String(month).padStart(2, "0")}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
    const [leaveRows] = await pool.query(
      `SELECT from_date, to_date, reason FROM leave_applications
       WHERE employee_id = ?
         AND status = 'APPROVED'
         AND from_date <= ? AND to_date >= ?`,
      [employeeId, lastDay, firstDay]
    );

    // Helper: format a Date object as YYYY-MM-DD using LOCAL time methods.
    // MySQL2 returns DATE columns as Date objects created in LOCAL timezone.
    // Using getFullYear/getMonth/getDate (local) preserves the correct calendar date,
    // whereas toISOString() converts to UTC which can shift the day backward
    // for timezones ahead of UTC (e.g., India UTC+5:30 → local June 17 → UTC June 16).
    const formatDate = (dt) => {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    // 4. Build holiday lookup using local date keys
    const holidayMap = {};
    for (const h of holRows) {
      const key = formatDate(h.holiday_date);
      holidayMap[key] = h.holiday_name;
    }

    // 5. Build attendance lookup using local date keys
    const attMap = {};
    for (const a of attRows) {
      const key = formatDate(a.attendance_date);
      attMap[key] = a;
    }

    // 5b. Build leave reason map: dateStr → leaveReason
    // Each leave application can span multiple days (from_date → to_date),
    // so we expand the range and map every date in between to its reason.
    const leaveReasonMap = {};
    for (const l of leaveRows) {
      const from = new Date(l.from_date);
      const to = new Date(l.to_date);
      // Walk day-by-day from from_date to to_date (inclusive)
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const key = formatDate(d);
        leaveReasonMap[key] = l.reason || "Leave";
      }
    }

    // 6. Today's local midnight (for filtering future dates)
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 7. Generate only past days of the month (up to today)
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, d);
      const dateStr = formatDate(dateObj);
      const dayName = dayNames[dateObj.getDay()];

      // Skip future dates — they haven't happened yet
      if (dateObj > todayLocal) continue;

      const attRecord = attMap[dateStr];
      const holidayName = holidayMap[dateStr];
      const isSunday = dateObj.getDay() === 0;

      let status = "absent";
      let reason = null;

      if (attRecord) {
        status = attRecord.status ? attRecord.status.toLowerCase() : "present";
        // If attendance status is "leave", pull reason from leave application
        if (status === "leave") {
          reason = leaveReasonMap[dateStr] || "Leave";
        }
      } else if (isSunday) {
        reason = "Sunday";
      } else if (holidayName) {
        reason = `Holiday: ${holidayName}`;
      }

      days.push({
        date: dateStr,
        day_name: dayName,
        punch_in: attRecord ? attRecord.punch_in : null,
        punch_out: attRecord ? attRecord.punch_out : null,
        gps_location: attRecord? attRecord.gps_location: null,
        status,
        reason,
        is_sunday: isSunday,
        is_holiday: !!holidayName,
      });
    }

    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.employee_name,
        code: employee.employee_code,
      },
      month: parseInt(month),
      year: parseInt(year),
      totalDays: days.length,
      presentDays: attRows.length,
      absentDays: days.length - attRows.length,
      days,
    });
  } catch (error) {
    console.log("Attendance Report Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}


module.exports={
    attendance,
    fetchAttendance,
    fetchMonthlyAttendanceDates,
    fetchMonthlyAttendanceReport
}