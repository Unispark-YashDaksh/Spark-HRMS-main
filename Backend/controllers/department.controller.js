const pool=  require("../config/db");

//POST API- Add a department
async function addDepartmentName(req, res) {

try{
    console.log(req.body);
    const departmentName = req.body.departmentName;

       // Validate department name
    if (!departmentName || !departmentName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const sql = `INSERT INTO departments (department_name) VALUES (?)`;

    const [result]= await pool.query(sql, [departmentName.trim()]); //departmentName.trim()----> remove extra spacing in department name
    res.status(200).json({
      success: true,
      message: "Department Added Successfully",
      departmentId: result.insertId // dn inserted id for frontend response
    });


}catch(error){
    console.log("Error Adding department", error);
        res.status(500).json({
        success: false,
        message: "Failed to add department" 
        })
    }
}

// GET-API Fetch Departments
async function getDepartments(req, res) {
  console.log("Get Fetch department api")
  try{
    const status = req.query.status;

    let sql = `SELECT * FROM departments`;
    const params = [];

    if (status === "Active" || status === "Inactive") {
      sql = `SELECT * FROM departments WHERE status = ?`;
      params.push(status);
    }

    const [result]= await pool.query(sql, params);

    return res.status(200).json({
      success: true,
      message: "Fetched Successfully",
      result,
    });

  }catch(error){
    console.log("Error fetching Departments:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch departments"
    })
  }
}

// PUT API - Update Department
async function updateDepartmentById(req, res) {
  console.log(req.body);
  console.log("Get Department by Id put api trigrring");

  try{
    const id = req.params.id;
    const departmentName = req.body.departmentName;

    const sql = `
        UPDATE departments
        SET department_name = ?
        WHERE id = ?
      `;

    const result= await pool.query(sql, [departmentName, id]);
     return res.status(200).json({
        success: true,
        message: "Department Updated Successfully",
      });
  }catch(error){
    console.log("Database Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

//PUT API
async function updateDepartmentStatus(req, res) {
  try{
        const id = req.params.id;
        const status = req.body.status;

        const sql = `UPDATE departments 
            SET status = ? 
            WHERE id = ?`;

       const result= await pool.query(sql, [status, id]);
        res.status(200).json({
          success: true,
          message: "Department Status Updated Successfully",
          result,
        });
    }catch(error){
      console.log("Error Department Status", error);
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }
}


module.exports={
    addDepartmentName,
    getDepartments,
    updateDepartmentById,
    updateDepartmentStatus
}