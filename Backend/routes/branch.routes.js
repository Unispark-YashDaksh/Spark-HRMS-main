const express=  require("express");
const router=  express.Router();

const {addBranch, getBranches, updateBranchbyId, updateBranchStatusById}= require("../controllers/branch.controller");

router.post("/addBranch", addBranch);
router.get("/fetchBranches", getBranches);
router.put("/updateBranch/:id", updateBranchbyId);
router.put("/updateBranchStatus/:id", updateBranchStatusById);

module.exports= router;