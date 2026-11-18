const express= require('express');
const router= express.Router();

const {punchOut}= require("../controllers/punchOut.controller");

router.post("/punchOut", punchOut);


module.exports= router;