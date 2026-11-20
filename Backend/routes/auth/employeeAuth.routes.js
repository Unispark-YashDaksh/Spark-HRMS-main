const express= require('express');
const router= express.Router();

const {register, login, getEmployeeProfile}= require("../../controllers/auth/employeeAuth.controller");

router.post("/register", register);
router.post("/login", login);
router.get("/employeeProfile/:employeeId", getEmployeeProfile)

module.exports=router