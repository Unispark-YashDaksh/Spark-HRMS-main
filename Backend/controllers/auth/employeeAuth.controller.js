const pool= require("../../config/db");

async function register(req, res) {
try {
    console.log(req.body);
    const { employeeCode, email, password } = req.body;

    if (!employeeCode || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check Employee Record Exits or not in employee master table
    const [checkRecordRows] = await pool.query(
      `SELECT id, employee_email_id FROM employee_master WHERE employee_code= ? AND employee_email_id= ?`,
      [employeeCode, email],
    );

    if (checkRecordRows.length === 0) {
      return res.send({
        success: false,
        message: "Employee Record Not found. Pleae contact HR",
      });
    }

    // if employee found
    const employeeId = checkRecordRows[0].id;

    const [userRows] = await pool.query(
      `SELECT * FROM users WHERE employee_id= ?`,
      [employeeId],
    );

    if (userRows.length > 0) {
      return res.send({
        success: false,
        message: "Account already exits. Please Login",
      });
    }

    await pool.query(
      `INSERT INTO users(employee_id, employee_email, password) VALUES(?,?,?)`,
      [employeeId, email, password],
    );

    return res.send({
      success: true,
      message: "Account Created Successfully... Please login",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
}

async function login(req, res) {
  const employeeId = req.headers["employee-id"];
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    console.log("Email:", email);
    console.log("Password:", password);

    const [rows] = await pool.query(
      `SELECT * FROM users
       WHERE employee_email = ?
       AND password = ?`,
      [email, password],
    );

    console.log("DB Result:", rows);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login Successfully",
      user: {
        id: rows[0].id,
        employee_id: rows[0].employee_id,
        employee_email: rows[0].employee_email,
      },
    });
  } catch (error) {
    console.log("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getEmployeeProfile(req, res) {
  try {
    const { employeeId } = req.params;

    const [profileData] = await pool.query(
      `SELECT
    employee_master.employee_name,
    employee_master.employee_code,
    employee_master.employee_joining_date,
    employee_master.employee_email_id,
    employee_master.employee_mobile_no,
    employee_master.city,
    employee_master.photo_url,
    employee_master.gender,

    designations.designation_name AS employee_designation,

    departments.department_name AS employee_department

FROM employee_master

LEFT JOIN designations
ON employee_master.designation_id = designations.id

LEFT JOIN departments
ON employee_master.department_id = departments.id

WHERE employee_master.id = ?;`,
      [employeeId],
    );
    if (profileData.length === 0) {
      return res.send({
        success: false,
        message: "DB Error",
      });
    }
    res.json({
      success: true,
      data: profileData[0],
    });
  } catch (err) {
    console.log(err);
    return res.send({
      success: false,
      message: err,
    });
  }
}

module.exports={
    register,
    login,
    getEmployeeProfile
}