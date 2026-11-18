const express= require('express');
const router=  express.Router();

const {addHolidays, fetchHolidays}= require("../controllers/holiday.controller");

router.post("/addHolidays", addHolidays);
router.get("/fetchHolidays", fetchHolidays);



module.exports=router