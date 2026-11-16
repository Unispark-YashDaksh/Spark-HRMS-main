const express= require("express");
const router= express.Router();

const {addDesignation, getDesignation, updateDesignationById, getDesignationStatus}= require("../controllers/designation.controller");

router.post("/addDesignation", addDesignation);
router.get("/getDesignation", getDesignation);
router.put("/updateDesignation/:id", updateDesignationById);
router.get("/designationStatus", getDesignationStatus);

module.exports= router;