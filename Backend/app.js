const express = require("express");
const app = express();
const departmentRoutes= require("./routes/department.routes");

app.use(express.json());

// Department Routes
app.use("/", departmentRoutes);

module.exports = app;