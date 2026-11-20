const pool= require("../config/db");

//POST API- Add Shift

async function addShift(req, res) {
    try{
        console.log(req.body);
        const shiftName = req.body.shiftName;
        const startTime = req.body.startTime;
        const endTime = req.body.endTime;
        const lateAfter = req.body.lateAfter;
        const halfdayAfter = req.body.halfdayAfter;

        const sql = `INSERT INTO shift_master (shift_name, start_time, end_time, late_after, half_day_after) VALUES (?, ?, ?, ?, ?)`;

       const [result]= await pool.query(sql,[shiftName, startTime, endTime, lateAfter, halfdayAfter]);
            res.status(200).json({
                success: true,
                message: "Added Successfully",
            });
    }catch(error){
        console.log("Error Adding Shift", error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// GET API- Fetch All Shifts
async function fetchShift(req, res) {
    try{
        const status = req.query.status;

        let sql = `SELECT * FROM shift_master`;
        const params = [];

        if (status === "Active" || status === "Inactive") {
            sql = `
                SELECT * FROM shift_master
                WHERE status = ?
            `;
            params.push(status);
        }

        const [result]=  await pool.query(sql, params)
            res.status(200).json({
                success: true,
                message: "Fetch Successfully",
                result,
            });
    }catch(error){
        console.log("Error Fetching Shifts", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


async function updateShiftById(req, res) {
    try{

        const id = req.params.id;
        const shiftName = req.body.shiftName;
        const startTime = req.body.startTime;
        const endTime = req.body.endTime;
        const lateAfter = req.body.lateAfter;
        const halfdayAfter = req.body.halfdayAfter;

        const sql = `
            UPDATE shift_master
            SET shift_name = ?,
                start_time = ?,
                end_time = ?,
                late_after = ?,
                half_day_after = ?
            WHERE id = ?
            `;
        const params = [shiftName, startTime, endTime, lateAfter, halfdayAfter, id];
     const [result]= await pool.query(sql, params);
            res.status(200).json({
                success: true,
                message: "Shift Updated Successfully",
            });
    }catch(error){
        console.log("Error Update Shift", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


async function updateStatusById(req, res) {
    try{
        const id = req.params.id;
        const status = req.body.status;

        const sql = `UPDATE shift_master
            SET status = ?
            WHERE id = ?`;

        const [result]= await pool.query(sql, [status, id]);
        res.status(200).json({
            success: true,
            message: "Status Updated Successfully",
        });
    }catch(error){
        console.log("Error Shift Status Update",error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports={
    addShift,
    fetchShift,
    updateShiftById,
    updateStatusById
}