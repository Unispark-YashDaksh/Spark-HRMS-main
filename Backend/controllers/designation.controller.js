const pool=  require("../config/db");


async function addDesignation(req, res) {
    try{
        console.log(req.body);
        const designationName = req.body.designation_name;
        const department_id = req.body.department_id;
        const status = req.body.status || "Active";

        const sql = `INSERT INTO designations(designation_name, department_id, status) VALUES(?, ?, ?)`;

        const [result] =  await pool.query(sql, [designationName, department_id, status]);
           res.status(200).json({
                success: true,
                message: "Data Saved Successfully",
            });
        }catch(error){
            console.log("Add Designation Error", error);

        res.status(500).json({
            success: false,
            message:  error.message
        })
    }
}

async function getDesignation(req, res) {
    try{

        const status = req.query.status;

        let sql = `
            SELECT designations.*, departments.department_name AS department
            FROM designations
            LEFT JOIN departments ON designations.department_id = departments.id
            `;
        const params = [];

        if (status === "Active" || status === "Inactive") {
            sql = `SELECT designations.*,
            departments.department_name AS department
            FROM designations
            LEFT JOIN departments ON designations.department_id = departments.id
            WHERE designations.status = ?
            `;
            params.push(status);
        }
        const [result]= await pool.query(sql, params);
            res.status(200).json({
            success: true,
            message: "Fetching Successfully",
            result,
        });
    }catch(error){
        console.log("Designation Fetch Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// this api only can designation update 
async function updateDesignationById(req, res) {
try{
        const id = req.params.id;
        const designationName = req.body.designation_name;
        const department_id = req.body.department_id;
        const status = req.body.status;

        const sql = `UPDATE designations
             SET designation_name = ?, department_id = ?, status = ?
             WHERE id = ?`;
    
       const result= await pool.query(sql,[designationName, department_id, status, id]);

        res.status(200).json({
            success: true,
            message: "Updated Successfully",
            result,
        });
    }catch(error){
        console.log("Update Designation Error", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
// GET API - Fetch Active Designations
async function getDesignationStatus(req, res) {
    try{
        const sql = `SELECT designations.*, 
        departments.department_name AS department
        FROM designations
        JOIN departments ON designations.department_id = departments.id
        WHERE designations.status = 'Active'
        AND departments.status = 'Active'
        `;

       const [result]= await pool.query(sql);

        res.status(200).json({
            success: true,
            message: "Fetching Successfully",
            result,
            });
    }catch(error){
        console.log("Error Designation Status", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports={
    addDesignation,
    getDesignation,
    updateDesignationById,
    getDesignationStatus
}