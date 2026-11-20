const express= require('express');
const router= express.Router();
const {addRole, fetchRoles, updateRoleById, updateRoleStatusById}= require("../controllers/role.controller");


router.post("/addRole", addRole);
router.get("/fetchRoles", fetchRoles);
router.put("/updateRole/:id", updateRoleById);
router.put("/updateRoleStatus/:id", updateRoleStatusById);

module.exports= router;
