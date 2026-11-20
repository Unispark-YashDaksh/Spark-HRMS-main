const express= require('express');
const router= express.Router();

const {pendingApprovalsByManager, updateWfhRequestsById}= require("../controllers/manager.controller")

router.get("/pendingApprovals/:managerId", pendingApprovalsByManager);
router.put("/wfhRequestStatus/:id", updateWfhRequestsById);
module.exports=router;