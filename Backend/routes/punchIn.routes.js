const express= require('express');
const routes= express.Router();

const {punchIn}= require("../controllers/punchIn.controller");
const {SelfieUpload}= require("../middleware/selfieUpload")

routes.post("/punchIn",SelfieUpload.single("selfie"), punchIn);

module.exports= routes
