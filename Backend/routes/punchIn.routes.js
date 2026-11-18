const express= require('express');
const routes= express.Router();

const {punchIn}= require("../controllers/punchIn.controller");

routes.post("/punchIn", punchIn);

module.exports= routes
