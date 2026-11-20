const pool= require("../config/db");

async function addHolidays(req, res) {
    try{
        console.log(req.body);
        const holidayDate = req.body.holidayDate;
        const holidayName = req.body.holidayName;

        const sql = `INSERT INTO holidays (holiday_date, holiday_name) VALUES (?, ?)`;

       const [result]= await pool.query(sql, [holidayDate, holidayName]);
            res.status(200).json({
                success: true,
                message: "Holidays Added Suceessfully",
            });
    }catch(error){
        console.log("Error Adding Holidays", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function fetchHolidays(req, res) {
    try{
        const sql = `SELECT * FROM holidays`;

       const [result]= await pool.query(sql);
        res.status(200).json({
            success: true,
            message: "Fetch Successfully",
            result,
        });
    }catch(error){
        console.log("Error Fetching Holidays", error);
        res.status(500).json({
            success: false,
            message:  error.message
        })
    }
}

module.exports={
    addHolidays,
    fetchHolidays
}