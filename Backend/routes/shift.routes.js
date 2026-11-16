const express= require("express");
const router=  express.Router();

const {addShift, fetchShift, updateShiftById, updateStatusById} = require("../controllers/shift.controller");

router.post("/addShift", addShift);
router.get("/fetchShift", fetchShift);
router.put("/updateShift/:id", updateShiftById);
router.put("/updateShiftStatus/:id", updateStatusById);

module.exports=router