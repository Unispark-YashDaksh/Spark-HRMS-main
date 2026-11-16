# Backend Refactoring Proposal: Modularizing API Structure Before Implementing Payroll, Onboarding & Offboarding Modules

**To:** [Project Manager/Senior Lead Name]  
**From:** [Your Name]  
**Subject:** Proposal to Refactor Backend Architecture Prior to Payroll, Onboarding & Offboarding Module Implementation  
**Date:** 31-Oct-2026  
**Project:** SparkHRMS

## 1. Objective

The purpose of this document is to propose a structural refactoring of the existing Node.js/Express backend before adding new modules (Payroll, Onboarding, Offboarding). The goal is to move from a monolithic, single-file API structure to a scalable, maintainable MVC-style architecture (Routes -> Controllers -> Services/Config) that aligns with industry standards and improves long-term productivity.

## 2. Current State Analysis (With Proof)

| Item | Observation | Proof |
| :-- | :-- | :-- |
| **Entry Point** | Application is started via Server.js as defined in package.json | package.json (main: " Server.js\, start: \node Server.js\) |
| **Monolithic File Size** | All core business logic and APIs are written in a single file. | Backend/Server.js - **2,289 lines** (verified via PowerShell count) |
| **Routing Approach** | Majority of routes are defined inline using app.get(), app.post(), app.put() directly inside Server.js. | Server.js lines ~87-2289 contain all department/branch/shift/role/employee/attendance/wfh/leave related APIs inline. |
| **Middleware & Config Mixed** | DB pool, Redis, Multer (local + Cloudinary), CORS, static serving, timezone config all live in Server.js. | Server.js lines 1-100 show mixed concerns (config, middleware, storage, DB setup). |
| **Modular Attempt Started** | A partial modular structure has been introduced. app.js exists with express() instance and routes mounted. A working pattern for routes/ + controllers/ is now in place. | Backend/app.js (routes mounted), Backend/routes/department.routes.js, Backend/controllers/department.controller.js. Newly added POST /addDepartmentName has been successfully restructured and tested via this pattern. |
| **Separation of Concerns Missing** | DB queries, validation, response formatting, file handling and business rules are all coupled together in route handlers within Server.js. | e.g. Server.js lines ~213-233 (/addDesignation), ~740-875 (/addNewEmployee with validation + multer + DB logic all in handler). |

## 3. Problems With Current Structure

| Problem | Impact | Explanation |
| :-- | :-- | :-- |
| **Poor Readability** | High | Navigating 2289 lines to find/update a single API is time-consuming and error-prone. |
| **Difficult Debugging** | High | When an issue arises, tracing request flow requires scrolling through unrelated modules (Attendance, WFH, Employee, etc.). |
| **Low Scalability** | High | Adding Payroll, Onboarding, Offboarding will bloat Server.js further making it unmaintainable. |
| **Tight Coupling** | High | Changes to one module risk breaking unrelated logic due to shared scope and lack of boundaries. |
| **Poor Reususes/Testing/Merge Conflicts** | High | DB logic not reusable, unit testing hard, multiple devs cause conflicts. |
| **Onboarding Friction** | High | New developers take significantly longer to understand, test or extend the codebase. |

## 4. Why This Needs To Be Done Before New Modules

Payroll, Onboarding and Offboarding are complex domains. They typically involve multiple entities (Employees, Contracts, Offers, CTC, Salary Components, Deductions, Leaves, Assets, Clearance, etc.), cross-module dependencies, validations, calculations and approvals. If implemented directly into Server.js, these modules will add hundreds of lines, making it impractically large. A clean foundation now will prevent technical debt from becoming unfixable later.

## 5. Proposed Architecture (Industry Standard)

` ext
Backend/
+-- app.js # Express app setup (middlewares, route registration)
+-- Server.js # Entry point (DB connection, server listen) - to be cleaned/wired via app.js
+-- config/ # DB, Redis, Cloudinary config (already exists)
+-- controllers/ # Request handling & response logic (HTTP layer)
+-- routes/ # Route definitions per module
+-- services/ # (Recommended) Business logic & complex calculations (Payroll formulas etc.)
+-- middlewares/ # Auth, validation, role-checks, error handling
+-- utils/ # Helper functions, formatters, constants
+-- validations/ # Request validation schemas (optional but recommended)
+-- uploads/ # File uploads (already exists)
`

**Flow:** Client Request ? routes/*.js ? controllers/*.js ? services/*.js (if needed) ? DB (config/db) ? Response

## 6. Module-Wise Implementation Plan

| Module | Planned Routes (Suggested) | Scope | Notes |
| :-- | :-- | :-- | :-- |
| **Onboarding** | /onboarding/* (create candidate/offer, initiate onboarding, checklist, documents upload) | Handle pre-joining flow, offer letter, onboarding tasks/checklist, document collection. | Should integrate with employee_master at conversion to employee. |
| **Payroll** | /payroll/* (salary structure, components, generate payslip, run payroll, approvals) | Salary setup, earnings/deductions, tax related fields, monthly payroll run, payslip generation & download. | Complex business logic - recommend moving calculations to services/payroll.service.js. Needs careful validation. |
| **Offboarding** | /offboarding/* (initiate exit, clearance checklist, assets, final settlement, relieving letter) | Resignation/exit workflow, approvals, asset return, clearance, notice period, final settlement tracking. | Should update employee_master.employeement_status and maintain audit trail. |

**Migration Strategy:** Migrate existing modules (Employees, Departments, Attendance, WFH, Leaves, Shifts, Roles, Branches, Designations, Holidays) **one by one** to the same structure. Do incremental migration, mounting new modular routes in Server.js until full migration is complete.

## 7. Proof Of Feasibility (Already Done)

- **Created:** outes/department.routes.js, controllers/department.controller.js
- **Wired:** Route mounted in Server.js (temporary wiring during migration)
- **Tested:** POST /addDepartmentName with JSON body works as expected post-refactor
- **Pattern Validated:** Controller handles validation, DB query via pool.query/async-await, proper error/success responses

## 8. Benefits After Refactoring

| Benefit | Explanation |
| :-- | :-- |
| **Improved Maintainability** | Each module is self-contained, easy to locate and modify. |
| **Better Scalability** | New modules (Payroll/Onboarding/Offboarding) can be added independently without touching unrelated code. |
| **Faster Debugging** | Bugs can be isolated to specific controller/route files instead of scanning 2000+ lines. |
| **Higher Reusability** | Common logic can move to services/, utils/, middlewares/ and shared across modules. |
| **Easier Code Reviews** | Smaller, focused files are easier and faster to review. |
| **Team Collaboration** | Reduces merge conflicts and allows parallel development across modules. |
| **Testability** | Controllers/services can be unit tested independently. |
| **Future-Proofing** | Cleaner structure makes it easier to add auth/roles, validations, logging, or migrate to TypeScript later. |

## 9. Recommendation & Request For Approval

**Request:** Kindly approve refactoring the backend to a modular outes/controllers (and where necessary services) structure **before** implementing the Payroll, Onboarding and Offboarding modules.

**Proposed Plan of Action:**

1. **Phase 1 (Immediate):** Continue incremental migration of existing APIs from Server.js to outes/ + controllers/. Keep mounting in Server.js until migration is complete.
2. **Phase 2:** Create module folders for payroll/, onboarding/, offboarding/ under outes/ and controllers/ following the validated pattern.
3. **Phase 3 (Post-Migration):** Once all APIs are migrated and tested, wire everything cleanly via pp.js and either keep Server.js as thin entry point or rename pp.js to Server.js as discussed.

**Note:** This will be done incrementally with testing after each module migration to ensure **zero impact on existing functionality** (Employees, Attendance, WFH, Leaves, etc. will remain unaffected).

**Prepared By:** [Developer Name] 
**Reviewed/Approved By:** [Project Manager/Senior Lead Name] 
**Status:** Pending Approval
