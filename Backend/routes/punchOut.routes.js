const express= require('express');
const router= express.Router();

const {punchOut}= require("../controllers/punchOut.controller");
const {SelfieUpload}= require("../middleware/selfieUpload")

router.post("/punchOut", SelfieUpload.single("selfie"), punchOut);


module.exports= router;