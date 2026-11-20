const express= require("express");
const router= express.Router();

const {addDepartmentName, getDepartments, updateDepartmentById, updateDepartmentStatus}= require("../controllers/department.controller");


router.post("/addDepartmentName", addDepartmentName);
router.get("/fetchDepartments", getDepartments);
router.put("/updateDepartment/:id", updateDepartmentById);
router.put("/updateDepartmentStatus/:id", updateDepartmentStatus);

module.exports= router;