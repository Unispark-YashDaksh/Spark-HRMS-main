const pool= require("../config/db");

async function assignLeaveBalance(req, res) {
  const {id}= req.params;

  try{
    //check if employee exit in employtee_master table
    const [employee]= await pool.query(`SELECT id FROM employee_master WHERE id=?`,[id]);

    if(employee.length===0){
      return res.send({
        success: false,
        message: "Employee Not Found"
      })
    }

    //check if balance already exitNo Leaves for current financial year
    const now = new Date();
    const currentFY = now.getMonth() >= 3 ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}` : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
    const [existing]= await pool.query(`SELECT id FROM employee_leave_balances WHERE employee_id=? AND financial_year= ?`,[id, currentFY]);

    // Rows check 
    if(existing.length>0){
      return res.status(409).json({
        error: "Leave Balance already exists for this year"
      })
    }

    // defaults
    const [defaults]= await pool.query(`SELECT Id.leave_type_id, id.default_days FROM leave_defaults Id JOIN leave_types lt ON lt.id= Id.leave_type_id WHERE Id.is_Active = TRUE AND lt.is_active= TRUE`);

    if(defaults.length===0){
      return res.status(400).json({
        error: "No Leave default configured"
      });
    }

    // Insert Balance
    const values= defaults.map(d=>[id, d.leave_type_id, d.default_days, 0, d.default_days, currentFY]);

    await pool.query(`INSERT INTO employee_leave_balances(employee_id, leave_type_id, total_days, used_days, remaining_days, financial_year)VALUES ?`, [values]);


    //Return the created balances
    const [balances]= await pool.query(`SELECT elb.*, lt.code, lt.leave_name FROM employee_leave_balances elb JOIN leave_types lt ON lt.id= elb.leave_type_id WHERE elb.employee_id=? AND elb.financial_year=?`, [id, currentFY]);

    res.status(201).json({message: "Leave Balance Assigned", data: balances});
    
  }catch(error){
    res.status(500).json({error: error.message});
  }
}

// Employee Initiate Leave Request POST API

async function initiateLeaveRequest(req, res) {
  const { employee_id, leave_type_id, from_date, to_date, reason } = req.body;

  try {
    // 1. Validate required fields
    if (!employee_id || !leave_type_id || !from_date || !to_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 2. Calculate total days (inclusive of both dates)
    const from = new Date(from_date);
    const to = new Date(to_date);
    if (to < from) {
      return res.status(400).json({ error: 'to_date must be after from_date' });
    }
    const totalDays = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;

    // 3. Check if employee exists
    const [employee] = await pool.query(
      'SELECT id FROM employee_master WHERE id = ?', [employee_id]
    );
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // 4. Check if leave type is active
    const [leaveType] = await pool.query(
      'SELECT id FROM leave_types WHERE id = ? AND is_active = TRUE', [leave_type_id]
    );
    if (leaveType.length === 0) {
      return res.status(404).json({ error: 'Leave type not found or inactive' });
    }

    // 5. Check for overlapping leave (same date range already applied)
    const [overlap] = await pool.query(
      `SELECT id FROM leave_applications 
       WHERE employee_id = ? 
       AND status IN ('PENDING', 'APPROVED')
       AND (
         (from_date <= ? AND to_date >= ?)
         OR (from_date <= ? AND to_date >= ?)
       )`,
      [employee_id, to_date, from_date, from_date, to_date]
    );
    if (overlap.length > 0) {
      return res.status(409).json({ error: 'Leave already applied for this date range' });
    }
    // 6. Check sufficient balance
    const fy = `${from.getFullYear()}-${String(from.getFullYear() + 1).slice(-2)}`;
    const [balance] = await pool.query(
      `SELECT remaining_days FROM employee_leave_balances
       WHERE employee_id = ? AND leave_type_id = ? AND financial_year = ?`,
      [employee_id, leave_type_id, fy]
    );

    if (balance.length === 0) {
      return res.status(400).json({ error: 'No leave balance found. Contact admin.' });
    }

    if (balance[0].remaining_days < totalDays) {
      return res.status(400).json({
        error: `Insufficient balance. Available: ${balance[0].remaining_days}, Requested: ${totalDays}`
      });
    }

    // 7. Insert application
    const [result] = await pool.query(
      `INSERT INTO leave_applications 
       (employee_id, leave_type_id, from_date, to_date, total_days, reason, status, applied_on)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', CURDATE())`,
      [employee_id, leave_type_id, from_date, to_date, totalDays, reason || null]
    );

    // 8. Return created record with joins
    const [application] = await pool.query(
      `SELECT la.*, lt.code, lt.leave_name, em.employee_name AS employee_name
       FROM leave_applications la
       JOIN leave_types lt ON lt.id = la.leave_type_id
       JOIN employee_master em ON em.id = la.employee_id
       WHERE la.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Leave applied successfully', data: application[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


//Fetch Leave Applications /Requestes GET API
async function fetchLeaveRequests(req, res) {
  const { employee_id, status, page = 1, limit = 20 } = req.query;

  try {
    let where = '1=1';
    const params = [];

    // Filter by employee (optional - admin sees all, employee sees own)
    if (employee_id) {
      where += ' AND la.employee_id = ?';
      params.push(employee_id);
    }

    // Filter by status (optional)
    if (status) {
      where += ' AND la.status = ?';
      params.push(status.toUpperCase());
    }

    const offset = (page - 1) * limit;

    const [applications] = await pool.query(
      `SELECT 
        la.id, la.from_date, la.to_date, la.total_days,
        la.reason, la.status, la.applied_on, la.approved_on,
        lt.code, lt.leave_name,
        em.employee_name AS employee_name,
        ap.employee_name AS approved_by_name
      FROM leave_applications la
      JOIN leave_types lt ON lt.id = la.leave_type_id
      JOIN employee_master em ON em.id = la.employee_id
      LEFT JOIN employee_master ap ON ap.id = la.approved_by
      WHERE ${where}
      ORDER BY la.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Get total count for pagination
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM leave_applications la WHERE ${where}`,
      params
    );

    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit),
      data: applications
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


// PUT /leave-applications/:id/status — approve/reject (admin)
async function updateStatusLeaveAppById(req, res) {
  const { id } = req.params;
  const { status, approved_by } = req.body; // "APPROVED" or "REJECTED"

  try {
    // 1. Validate status
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    // 2. Fetch current application
    const [application] = await pool.query(
      `SELECT la.*, elb.id AS balance_id, elb.remaining_days, 
              lt.code, em.employee_name AS employee_name
       FROM leave_applications la
       JOIN leave_types lt ON lt.id = la.leave_type_id
       JOIN employee_master em ON em.id = la.employee_id
       LEFT JOIN employee_leave_balances elb 
         ON elb.employee_id = la.employee_id 
         AND elb.leave_type_id = la.leave_type_id
          AND elb.financial_year = CONCAT(
            YEAR(la.from_date) - IF(MONTH(la.from_date) < 4, 1, 0),
            '-',
            RIGHT(YEAR(la.from_date) + IF(MONTH(la.from_date) < 4, 0, 1), 2)
          )
       WHERE la.id = ?`,
      [id]
    );

    if (application.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = application[0];

    if (app.status !== 'PENDING') {
      return res.status(400).json({ error: `Already ${app.status.toLowerCase()}` });
    }

    // 3. If approving, deduct from balance
    if (status === 'APPROVED') {
      if (!app.balance_id) {
        return res.status(400).json({ error: 'No leave balance found' });
      }
      if (app.remaining_days < app.total_days) {
        return res.status(400).json({ 
          error: `Insufficient balance. Available: ${app.remaining_days}, Required: ${app.total_days}`
        });
      }

      await pool.query(
        `UPDATE employee_leave_balances 
         SET used_days = used_days + ?, 
             remaining_days = remaining_days - ?
         WHERE id = ?`,
        [app.total_days, app.total_days, app.balance_id]
      );
    }

    // 4. Update application status
    await pool.query(
      `UPDATE leave_applications 
       SET status = ?, approved_by = ?, approved_on = NOW()
       WHERE id = ?`,
      [status, approved_by, id]
    );

    // 5. Return updated record
    const [updated] = await pool.query(
      `SELECT la.*, lt.code, lt.leave_name, em.employee_name AS employee_name,
              ap.employee_name AS approved_by_name
       FROM leave_applications la
       JOIN leave_types lt ON lt.id = la.leave_type_id
       JOIN employee_master em ON em.id = la.employee_id
       LEFT JOIN employee_master ap ON ap.id = la.approved_by
       WHERE la.id = ?`,
      [id]
    );

    res.status(200).json({ 
      message: `Leave ${status.toLowerCase()} successfully`,
      data: updated[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function leaveAdjustment(req, res) {
  const { employee_id, leave_type_id, adjustment_type, days, reason, adjusted_by } = req.body;

  try {
    // 1. Validate
    if (!employee_id || !leave_type_id || !adjustment_type || !days || !adjusted_by) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['CREDIT', 'DEBIT'].includes(adjustment_type)) {
      return res.status(400).json({ error: 'Type must be CREDIT or DEBIT' });
    }

    // 2. Get current financial year balance
    const now = new Date();
    const currentFY = now.getMonth() >= 3 ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}` : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
    const [balance] = await pool.query(
      `SELECT id, total_days, used_days, remaining_days 
       FROM employee_leave_balances 
       WHERE employee_id = ? AND leave_type_id = ? AND financial_year = ?`,
      [employee_id, leave_type_id, currentFY]
    );

    if (balance.length === 0) {
      return res.status(400).json({ error: 'No balance found. Auto-assign first.' });
    }

    const bal = balance[0];
    let newTotal = bal.total_days;
    let newRemaining = bal.remaining_days;

    if (adjustment_type === 'CREDIT') {
      newTotal += parseInt(days);
      newRemaining += parseInt(days);
    } else { // DEBIT
      if (bal.remaining_days < days) {
        return res.status(400).json({ error: 'Cannot debit more than remaining days' });
      }
      newRemaining -= parseInt(days);
    }

    // 3. Update balance
    await pool.query(
      `UPDATE employee_leave_balances 
       SET total_days = ?, remaining_days = ?
       WHERE id = ?`,
      [newTotal, newRemaining, bal.id]
    );

    // 4. Log adjustment
    const [result] = await pool.query(
      `INSERT INTO leave_adjustments 
       (employee_id, leave_type_id, adjustment_type, days, reason, adjusted_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, leave_type_id, adjustment_type, days, reason, adjusted_by]
    );

    res.status(201).json({
      message: `${adjustment_type} of ${days} days applied`,
      data: {
        new_total_days: newTotal,
        new_remaining_days: newRemaining
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function carryForwardLeaves(req ,res) {
  const { from_year, to_year } = req.body; // "2025-2026" → "2026-2027"

  try {
    // 1. Get EL leave type ID
    const [elType] = await pool.query(
      `SELECT id FROM leave_types WHERE code = 'EL' AND is_active = TRUE`
    );
    if (elType.length === 0) {
      return res.status(400).json({ error: 'EL leave type not found' });
    }
    const elTypeId = elType[0].id;

    // 2. Get max carry-forward days (from a config table or hardcoded)
    const maxCarryForward = 15; // configurable

    // 3. Get all EL balances for the old year with remaining days > 0
    const [balances] = await pool.query(
      `SELECT elb.*, em.employee_name
       FROM employee_leave_balances elb
       JOIN employee_master em ON em.id = elb.employee_id
       WHERE elb.leave_type_id = ? 
         AND elb.financial_year = ?
         AND elb.remaining_days > 0`,
      [elTypeId, from_year]
    );

    if (balances.length === 0) {
      return res.status(200).json({ message: 'No EL balances to carry forward' });
    }

    let carried = 0;

    for (const bal of balances) {
      // 4. Cap carry-forward amount
      const carryDays = Math.min(bal.remaining_days, maxCarryForward);

      if (carryDays <= 0) continue;

      // 5. Check if new year balance already exists
      const [existing] = await pool.query(
        `SELECT id FROM employee_leave_balances 
         WHERE employee_id = ? AND leave_type_id = ? AND financial_year = ?`,
        [bal.employee_id, elTypeId, to_year]
      );

      if (existing.length > 0) {
        // Update existing — add carry days to totals
        await pool.query(
          `UPDATE employee_leave_balances 
           SET total_days = total_days + ?,
               remaining_days = remaining_days + ?
           WHERE id = ?`,
          [carryDays, carryDays, existing[0].id]
        );
      } else {
        // Create new year balance with default + carry
        const [defaults] = await pool.query(
          `SELECT default_days FROM leave_defaults 
           WHERE leave_type_id = ? AND is_Active = TRUE`,
          [elTypeId]
        );
        const defaultDays = defaults.length > 0 ? defaults[0].default_days : 0;

        await pool.query(
          `INSERT INTO employee_leave_balances 
           (employee_id, leave_type_id, total_days, used_days, remaining_days, financial_year)
           VALUES (?, ?, ?, 0, ?, ?)`,
          [bal.employee_id, elTypeId, defaultDays + carryDays, defaultDays + carryDays, to_year]
        );
      }

      // 6. Log as adjustment (optional but recommended)
      await pool.query(
        `INSERT INTO leave_adjustments 
         (employee_id, leave_type_id, adjustment_type, days, reason, adjusted_by)
         VALUES (?, ?, 'CREDIT', ?, 'Carry forward from ' + ?, 0)`,
        [bal.employee_id, elTypeId, carryDays, from_year]
      );

      carried++;
    }

    res.status(200).json({
      message: `Carry-forward completed`,
      employees_updated: carried,
      from: from_year,
      to: to_year
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// For Use Employee GET API
async function fetchLeaveBalance(req, res) {
  const {id}= req.params;
  const {year}= req.query;

  try{
    const [employee]= await pool.query(`SELECT id, employee_email_id FROM employee_master WHERE id= ?`, [id]);

    if(employee.length===0){
      return res.status(404).json({
        error: "Employee Not Found"
      })
    }

    const now = new Date();
    const currentFY = year || (now.getMonth() >= 3 ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}` : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`);
    //Fetch Balances with leave type
    const [balances]= await pool.query(`SELECT elb.id, elb.total_days, elb.used_days, elb.remaining_days, elb.financial_year, lt.id AS leave_type_id, lt.code, lt.leave_name FROM employee_leave_balances elb JOIN leave_types lt ON lt.id= elb.leave_type_id WHERE elb.employee_id= ? AND elb.financial_year= ? ORDER BY lt.code`,[id, currentFY]);

    if(balances.length===0){
      return res.status(200).json({
        message: "No Balance found for this year",
        data: [],
        employee: employee[0].name
      });
    }

    //Return response
    res.status(200).json({
      employee: employee[0].name,
      financial_year: currentFY,
      total: balances.reduce((sum, b)=> sum * b.remaining_days, 0),
      leaves: balances
    })
  }catch(error){
    res.status(500).json({
      error: error.message
    });
  }
}


module.exports={
    assignLeaveBalance,
    initiateLeaveRequest,
    fetchLeaveRequests,
    updateStatusLeaveAppById,
    leaveAdjustment,
    carryForwardLeaves,
    fetchLeaveBalance
}