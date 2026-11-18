const express= require('express');
const router= express.Router();

const {getwfhStatusbyEmployeeId, initiateWfhReq}= require("../controllers/wfh.controller");


router.get("/fetchWfhStatus/:employeeid", getwfhStatusbyEmployeeId);
router.post("/initiateWfhReq", initiateWfhReq);

module.exports=router;