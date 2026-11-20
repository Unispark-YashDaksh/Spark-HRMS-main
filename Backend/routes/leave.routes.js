const express= require('express');
const router= express.Router();
const {assignLeaveBalance, initiateLeaveRequest, fetchLeaveRequests, updateStatusLeaveAppById, leaveAdjustment, carryForwardLeaves, fetchLeaveBalance}= require("../controllers/leave.controller");

const {fetchActiveEmployees}= require("../controllers/addNewEmployee.controller");


router.post("/employees/:id/leave-balance", assignLeaveBalance);
router.post("/applyLeaveRequest", initiateLeaveRequest);
router.get("/fetchLeaveRequests", fetchLeaveRequests);
router.put("/updateLeaveStatus/:id", updateStatusLeaveAppById);
router.post("/leaveAdjustment", leaveAdjustment);
router.post("/carryforwardleaves", carryForwardLeaves);
router.get("/fetchLeaveBalance/:id", fetchLeaveBalance);
router.get("/fetchActiveEmployees", fetchActiveEmployees);


module.exports=router;
