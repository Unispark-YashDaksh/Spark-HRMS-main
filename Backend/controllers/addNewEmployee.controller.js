const pool= require("../config/db");

async function addNewEmployee(req, res) {
    try{
        console.log(req.body);
        console.log(req.file);//this will show cloudinaryuploads details

        const employeeForm = req.body;
        const cloudinaryUrl = req.file ? req.file.path: null;


        // this fields check form fields
        const requiredFields={
            employee_code: "Employee Code",
            employee_name: "Employee Name",
            gender: "Gender",
            designation_id: "Designation",
            department_id: "Deparment",
            shift_id: "Shift",
            branch_id: "Branch",
            role_id:"Role",
            employee_mobile_no: "Employee Mobile No",
            employee_email_id: "Email ID",
            employee_joining_date: "Joining Date",
        }


        console.log("Required Fields:", requiredFields);

        for(const field in requiredFields){
            // debugging and checking are every fields
            console.log("Checking:", field, "Value", employeeForm[field])

            if(!employeeForm[field] || employeeForm[field].trim()=== ""){
                console.log("Missing Field:", field);
                return res.status(400).json({
                    success: false,
                    field: field,
                    message: `${requiredFields[field]} is required`
                })
            }
        }

            const sql = `
                INSERT INTO employee_master(
                employee_code,
                employee_name,
                gender,
                designation_id,
                department_id,
                branch_id,
                shift_id,
                role_id,
                reporting_manager_id,
                employeement_status,
                employee_mobile_no,
                employee_email_id,
                employee_joining_date,
                city,
                emergency_contact_no,
                employee_adhar_no,
                employee_bank_account_no,
                employee_bank_name,
                employee_bank_ifsc_code,
                employee_uan_no,
                photo_url
                )
                
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

                const params= [
                    employeeForm.employee_code,
                    employeeForm.employee_name,
                    employeeForm.gender,
                    employeeForm.designation_id,
                    employeeForm.department_id,
                    employeeForm.branch_id,
                    employeeForm.shift_id,
                    employeeForm.role_id,

                    // if empty then store NULL
                    employeeForm.reporting_manager_id || null,

                    // if empty then ACTIVE
                    employeeForm.employeement_status || "ACTIVE",

                    employeeForm.employee_mobile_no,
                    employeeForm.employee_email_id,

                    // if empty then NULL
                    employeeForm.employee_joining_date || null,

                    employeeForm.city,
                    employeeForm.emergency_contact_no,
                    employeeForm.employee_adhar_no,
                    employeeForm.employee_bank_account_no,
                    employeeForm.employee_bank_name,
                    employeeForm.employee_bank_ifsc_code,
                    employeeForm.employee_uan_no,
                    cloudinaryUrl,
                ]

            const [result]= await pool.query(sql, params);
                res.status(200).json({
                    success: true,
                    message: "Data Added Successfully",
                    url: cloudinaryUrl
                });
    
    }catch(error){
        console.log("Error Adding Employee", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function updateEmployeeById(req, res) {
    try{
        const id = req.params.id;
        const employeeCode = req.body.employee_code;
        const employeeName = req.body.employee_name;
        const gender = req.body.gender;
        const designationId = req.body.designation_id;
        const departmentId = req.body.department_id;
        const branchId = req.body.branch_id;
        const shiftId = req.body.shift_id;
        const role = req.body.role_id;
        const reportingManagerId = req.body.reporting_manager_id || null;
        const employeementStatus = req.body.employeement_status;
        const employeeMobileNo = req.body.employee_mobile_no;
        const employeeEmailId = req.body.employee_email_id;
        const employeeJoiningDate = req.body.employee_joining_date || null;
        const city = req.body.city;
        const emergencyContactNo = req.body.emergency_contact_no;
        const employeeAadharNo = req.body.employee_adhar_no;
        const employeeBankAccNo = req.body.employee_bank_account_no;
        const employeeBnakName = req.body.employee_bank_name;
        const employeeIFSCCode = req.body.employee_bank_ifsc_code;
        const employeeUANNo = req.body.employee_uan_no;
        const photoUrl = req.file? req.file.path: req.body.photo_url || null;

        const sql = `
            UPDATE employee_master
            SET employee_code = ?,
            employee_name = ?,
            gender = ?,
            designation_id = ?,
            department_id = ?,
            branch_id = ?,
            shift_id = ?,
            role_id = ?,
            reporting_manager_id = ?,
            employeement_status = ?,
            employee_mobile_no = ?,
            employee_email_id = ?,
            employee_joining_date = ?,
            city = ?,
            emergency_contact_no = ?,
            employee_adhar_no = ?,
            employee_bank_account_no = ?,
            employee_bank_name = ?,
            employee_bank_ifsc_code = ?,
            employee_uan_no = ?,
            photo_url = ?
            WHERE id = ?`;

        const params= [
            employeeCode,
            employeeName,
            gender,
            designationId,
            departmentId,
            branchId,
            shiftId,
            role,
            reportingManagerId,
            employeementStatus,
            employeeMobileNo,
            employeeEmailId,
            employeeJoiningDate,
            city,
            emergencyContactNo,
            employeeAadharNo,
            employeeBankAccNo,
            employeeBnakName,
            employeeIFSCCode,
            employeeUANNo,
            photoUrl,
            id,
        ];

            const [result]= await pool.query(sql, params);
            res.status(200).json({
                success: true,
                message: "Data Updated Successfully",
                result,
            });
    }catch(error){
            console.log("Error Updating Employee", error);
            res.status(500).json({
                success: false,
                message: error.message
            })
    }
}

async function fetchLastEmployeeCode(req, res) {
    try{
        const sql= `SELECT employee_code FROM employee_master ORDER BY id DESC LIMIT 1`;

        const [result]= await pool.query(sql);
            console.log(`Fetch Last Generated Employee ${result[0].employee_code}`);
            return res.status(200).json({
                success: true,
                employee_code: result[0].employee_code
            });
    }catch(error){
        console.log("Error Fetching Last Employee", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function updateEmployeeStatusById(req, res) {
    try{
        const id = req.params.id;
        const status = req.body.status;

        const sql = `
            UPDATE employee_master
            SET employeement_status = ?
            WHERE id = ?`;

        const [result]= await pool.query(sql, [status, id]);
            res.status(200).json({
                success: true,
                message: "Status Updated Successfully",
                result,
            });
    }catch(error){
        console.log("Error Updating Status Employee", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function fetchEmployees(req, res) {
    try{
            const status = req.query.status;

            //pagnition fuctioanlity logic
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Main Employee Fetch Query
            let sql = `SELECT employee_master.*,
                departments.department_name,
                designations.designation_name,
                branches.branch_name,
                shift_master.shift_name,
                roles.role_name

                FROM employee_master
                JOIN departments ON employee_master.department_id= departments.id
                JOIN designations ON employee_master.designation_id= designations.id
                JOIN branches ON employee_master.branch_id= branches.id
                JOIN shift_master ON employee_master.shift_id= shift_master.id
                JOIN roles ON employee_master.role_id = roles.id
                LIMIT ? OFFSET ?
                `;
                const params = [];

                if (status === "ACTIVE" || status === "RESIGNED") {
                sql = `SELECT employee_master.*,
                departments.department_name,
                designations.designation_name,
                branches.branch_name,
                shift_master.shift_name,
                roles.role_name

                FROM employee_master
                JOIN departments ON employee_master.department_id= departments.id
                JOIN designations ON employee_master.designation_id= designations.id
                JOIN branches ON employee_master.branch_id= branches.id
                JOIN shift_master ON employee_master.shift_id= shift_master.id
                JOIN roles ON employee_master.role_id = roles.id
                WHERE employee_master.employeement_status = ?
                LIMIT ? OFFSET ?
                `;
                    params.push(status);
                }
                params.push(limit, offset);

                let countSql = `SELECT COUNT(*) AS totalEmployees FROM employee_master`; // added this to get the total count of employees for pagination
                const countParams = [];

                if (status === "ACTIVE" || status === "RESIGNED") {
                    countSql = `SELECT COUNT(*) AS totalEmployees
                    FROM employee_master
                    WHERE employeement_status = ?
                    `;
                    countParams.push(status);
                }
                
                const activeEmpSql = `SELECT COUNT(*) AS activeEmployees FROM employee_master WHERE employeement_status = 'ACTIVE'`; 
                // added this to get the total count of active employees for dashboard stats

                const[ [result],[countResult], [activeEmpResult]]= await Promise.all([pool.query(sql, params), pool.query(countSql, countParams), pool.query(activeEmpSql)])

                const totalCount = countResult[0].totalEmployees;
                const activeEmpCount = activeEmpResult[0].activeEmployees;

                 return res.status(200).json({
                    success: true,
                    message: "Fetching Employees",
                    totalEmployees: totalCount,
                    activeEmployees: activeEmpCount,
                    result,
                });
    }catch(error){
        console.log("Error Fetching Employees", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function fetchOneEmployeeById(req, res) {
    try{
        const id = req.params.id;

        const sql = `
            SELECT employee_master.*,
            departments.department_name,
            designations.designation_name,
            branches.branch_name,
            shift_master.shift_name,
            roles.role_name
            FROM employee_master
            JOIN departments ON employee_master.department_id = departments.id
            JOIN designations ON employee_master.designation_id = designations.id
            JOIN branches ON employee_master.branch_id = branches.id
            JOIN shift_master ON employee_master.shift_id = shift_master.id
            JOIN roles ON employee_master.role_id = roles.id
            WHERE employee_master.id = ?
            `;

        const [result]= await pool.query(sql, [id]);
            res.status(200).json({
            success: true,
            message: "One employee Fetched Successfully",
            result,
            });
    }catch(error){
        console.log("Error Fetching One Employee", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function fetchActiveEmployees(req, res) {
    try{
        const sql = `
            SELECT id, employee_name, employee_code
            FROM employee_master
            WHERE employeement_status = 'ACTIVE'
        `;

         const [result]= await pool.query(sql);
            res.status(200).json({
                success: true,
                message: "Status Fetched Successfully",
                result,
            });
    }catch(error){
        console.log("Error Fetching Active Employees", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



module.exports={
    addNewEmployee,
    updateEmployeeById,
    fetchLastEmployeeCode,
    updateEmployeeStatusById,
    fetchEmployees,
    fetchOneEmployeeById,
    fetchActiveEmployees
}