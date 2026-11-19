const express= require('express');
const router= express.Router();
const {attendance, fetchAttendance, fetchMonthlyAttendanceDates, fetchMonthlyAttendanceReport }= require("../controllers/attendanceCheck.controller");
const {fetchActiveEmployees}= require("../controllers/addNewEmployee.controller")

router.post("/attendanceCheck", attendance);
router.get("/fetchAttendance", fetchAttendance);
router.get("/attendance/:employeeId/:month/:year", fetchMonthlyAttendanceDates);
router.get("/attendance/report/:employeeId/:month/:year", fetchMonthlyAttendanceReport);
router.get("/fetchActiveEmployees", fetchActiveEmployees);



module.exports= router