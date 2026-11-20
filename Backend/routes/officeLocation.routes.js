const express= require('express');

const router= express.Router();

const {bypassOfficeLocationRadius}= require("../controllers/officeLocation.controller");

router.get("/office-location/:employeeId", bypassOfficeLocationRadius);

module.exports=router;