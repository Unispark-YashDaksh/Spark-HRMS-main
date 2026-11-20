const pool=  require("../config/db");

// POST API- Add Branch
async function addBranch(req, res) {
    try{
        const {
            branchName,
            address,
            city,
            state,
            pincode
        }= req.body
        console.log(req.body);
        //Validate Required Fields
        if(!branchName?.trim() || !address?.trim() || !city?.trim() || !state?.trim() ||  !pincode?.toString().trim()){
            return res.status(400).json({
                success: false,
                message: "All Fields are required"
            })
        }


        const sql = `INSERT INTO branches (branch_name, address, city, state, pincode) VALUES(?,?,?,?,?)`;

        const [result]=  await pool.query(sql,[
            branchName.trim(), address.trim(), city.trim(), state.trim(), pincode.trim()]);
            res.status(200).json({
                success: true,
                message: "Data Added Successfully",
            });
    }catch(error){
        console.log("Error Adding Branch", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Fetch ALL branches GET-API

async function getBranches(req, res) {
    try{

        const status = req.query.status;
        let sql = `SELECT * FROM branches;`;

        const params = [];

        if (status === "Active" || status === "Inactive") {
            sql = `
                SELECT * FROM branches
                WHERE status = ?
            `;
            params.push(status);
        }

   const [result] = await pool.query(sql, params);
            res.status(200).json({
                success: true,
                message: "Fetch Successfully",
                result,
            });

    }catch(error){
        console.log("Fetch Branch Error", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// PUT-API Update Branch by Id
async function updateBranchbyId(req, res) {
    try{

        const id = req.params.id;
        const branchName = req.body.branchName;
        const address = req.body.address;
        const city = req.body.city;
        const state = req.body.state;
        const pincode = req.body.pincode;

        const sql = `
            UPDATE branches
            SET branch_name = ?,
                address = ?,
                city = ?,
                state = ?,
                pincode = ?
            WHERE id = ?
            `;

        const params = [branchName, address, city, state, pincode, id];

       const [result]= await pool.query(sql, params)
                res.status(200).json({
                success: true,
                message: "Branch Updated Successfully",
                result,
            });
    }catch(error){
        console.log("Error Update Branch", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function updateBranchStatusById(req, res) {
    
    try{
        const id = req.params.id;
        const status = req.body.status;

        const sql = `
            UPDATE branches
            SET status = ?
            WHERE id = ?
            `;

       const [result]= await pool.query(sql, [status, id]);
            res.status(200).json({
                success: true,
                message: "Status Updated Successfully",
                result,
            });
    }catch(error){
        console.log("Error Branch Status", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports= {
    addBranch,
    getBranches,
    updateBranchbyId,
    updateBranchStatusById
}