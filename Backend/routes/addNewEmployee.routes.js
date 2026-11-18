const express= require('express');
const router= express.Router();

const {addNewEmployee, updateEmployeeById, updateEmployeeStatusById, fetchLastEmployeeCode, fetchEmployees, fetchOneEmployeeById, fetchActiveEmployees}= require("../controllers/addNewEmployee.controller");

router.post("/addNewEmployee", addNewEmployee);
router.put("/updateEmployee/:id", updateEmployeeById);
router.put("/updateEmployeeStatus/:id", updateEmployeeStatusById);
router.get("/fetchLastEmployeeCode", fetchLastEmployeeCode);
router.get("/fetchEmployees", fetchEmployees);
router.get("/fetchOneEmployee/:id", fetchOneEmployeeById);
router.get("/fetchActiveEmployees", fetchActiveEmployees);


module.exports= router
