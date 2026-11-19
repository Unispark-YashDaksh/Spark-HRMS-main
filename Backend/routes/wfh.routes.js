const express= require('express');
const router= express.Router();

const {getwfhStatusbyEmployeeId, initiateWfhReq}= require("../controllers/wfh.controller");


router.get("/fetchWfhStatus/:employeeId", getwfhStatusbyEmployeeId);
router.get("/wfh-status/:employeeId", getwfhStatusbyEmployeeId);
router.post("/initiateWfhReq", initiateWfhReq);

module.exports=router;