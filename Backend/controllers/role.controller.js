const pool= require("../config/db");

async function addRole(req, res) {
    try{
        console.log(req.body);
        const RoleName = req.body.RoleName;
        const Desc = req.body.Desc;

        const sql = `INSERT INTO roles(role_name, description) VALUES (?,?)`;

       const [result]= await pool.query(sql, [RoleName, Desc]);
            res.status(200).json({
                success: true,
                message: "Data Added Successfully",
            });
    }catch(error){
        console.log("Error Adding Role", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function fetchRoles(req, res) {
    try{
        const status = req.query.status;

        let sql = `SELECT * FROM roles`;
        const params = [];

        if (status === "Active" || status === "Inactive") {
            sql = `
                SELECT * FROM roles
                WHERE status = ?
            `;

            params.push(status);
        }

        const [result]= await pool.query(sql, params);
            res.status(200).json({
                success: true,
                message: "Data Fetch Successfully",
                result,
            });
    }catch(error){
        console.log("Error Fetching roles", error);
        res.status(500).json({
            success: false,
            message: error.message

        })
    }
}

async function updateRoleById(req, res) {
    try{
        const id = req.params.id;
        const RoleName = req.body.RoleName;
        const Desc = req.body.Desc;

        const sql = `
            UPDATE roles
            SET role_name = ?,
            description = ?
            WHERE id = ?
            `;

        const [result]= await pool.query(sql, [RoleName, Desc, id]);
            res.status(200).json({
                success: true,
                message: "Role Updated Successfully",
            });
    }catch(error){
        console.log("Error Updating role", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function updateRoleStatusById(req, res) {
    try{
        const id = req.params.id;
        const status = req.body.status;

        const sql = `
            UPDATE roles
            SET status = ?
            WHERE id = ?
            `;

        const [result]= await pool.query(sql, [status, id]);
            res.status(200).json({
                success: true,
                message: "Status Updated Successfully",
            });
    }catch(error){
        console.log("Error Updating Status", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports={
    addRole,
    fetchRoles,
    updateRoleById,
    updateRoleStatusById
    
}