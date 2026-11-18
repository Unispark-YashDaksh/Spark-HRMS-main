const express= require('express');

const router= express.Router();

const {bypassOfficeLocationRadius}= require("../controllers/officeLocation.controller");

router.post("/byPassOfficeLocation/:employeeId", bypassOfficeLocationRadius);

module.exports=router;