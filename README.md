# AssetHub API Documentation

## 1. Overview

AssetHub is a maintenance and asset management API built with:

* Django
* Django REST Framework
* JWT Authentication
* SQLite/PostgreSQL
* QR Code integration
* Role-Based Access Control (RBAC)

The API manages:

* Users and roles
* Companies
* Client profiles
* Assets
* Asset QR codes
* Maintenance schedules
* Work orders
* Maintenance assignments
* Maintenance reports
* Client report reviews
* Report rejection and reassignment

---

# 2. Base URL

For local development:

```text
http://127.0.0.1:8000
```

API endpoints use the `/api/` prefix.

Example:

```text
http://127.0.0.1:8000/api/auth/token/
```

---

# 3. Authentication

AssetHub uses JWT authentication.

## Obtain Access Token

**POST**

```text
/api/auth/token/
```

### Request

```json
{
    "username": "admin",
    "password": "password"
}
```

### Response

```json
{
    "refresh": "JWT_REFRESH_TOKEN",
    "access": "JWT_ACCESS_TOKEN"
}
```

Use the access token in subsequent requests:

```http
Authorization: Bearer JWT_ACCESS_TOKEN
```

---

## Refresh Token

**POST**

```text
/api/auth/token/refresh/
```

### Request

```json
{
    "refresh": "JWT_REFRESH_TOKEN"
}
```

### Response

```json
{
    "access": "NEW_ACCESS_TOKEN"
}
```

---

# 4. User Roles

AssetHub currently supports three roles.

| Role       | Responsibility                                          |
| ---------- | ------------------------------------------------------- |
| ADMIN      | Full system administration                              |
| TECHNICIAN | Performs assigned maintenance                           |
| CLIENT     | Owns assets/work orders and reviews maintenance reports |

### ADMIN

Can:

* Manage users
* Create companies
* Manage companies
* Create assets
* Manage maintenance schedules
* Create maintenance assignments
* View all maintenance
* Reassign rejected maintenance
* View rejected reports
* Manage system operations

### TECHNICIAN

Can:

* View assigned maintenance
* Scan asset QR codes
* Create maintenance reports
* Update assigned maintenance
* View information related to assigned work

Technicians do not manage work orders.

### CLIENT

Can:

* View their company information
* View their assets
* Create work orders
* View their work orders
* View maintenance reports related to their assets
* Accept maintenance reports
* Reject maintenance reports

Clients cannot create maintenance reports.

---

# 5. Current User

## Get Current User

**GET**

```text
/api/auth/me/
```

### Authentication

Required.

### Allowed Roles

* ADMIN
* TECHNICIAN

### Example Response

```json
{
    "id": 3,
    "username": "tech",
    "email": "tech@example.com",
    "role": "TECHNICIAN"
}
```

---

# 6. Profile API

## Get Profile

**GET**

```text
/api/profile/
```

Returns the authenticated user's profile.

### Authentication

Required.

## Update Profile

**PUT/PATCH**

```text
/api/profile/
```

The authenticated user can update their own profile.

---

# 7. Users

## List Users

**GET**

```text
/api/users/
```

### Allowed Role

ADMIN

Returns all users.

---

## Create User

**POST**

```text
/api/users/
```

### Allowed Role

ADMIN

Example:

```json
{
    "username": "client1",
    "email": "client@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Client",
    "role": "CLIENT",
    "company": 1
}
```

---

## Get User

**GET**

```text
/api/users/{id}/
```

### Allowed Role

ADMIN

---

## Update User

**PUT/PATCH**

```text
/api/users/{id}/
```

### Allowed Role

ADMIN

---

## Delete User

**DELETE**

```text
/api/users/{id}/
```

### Allowed Role

ADMIN

---

# 8. Companies

Companies represent the client organizations using AssetHub.

## List Companies

**GET**

```text
/api/companies/
```

### Allowed Role

ADMIN

---

## Create Company

**POST**

```text
/api/companies/
```

### Allowed Role

ADMIN

Example:

```json
{
    "name": "ABC Engineering",
    "registration_number": "REG-2026-001",
    "email": "info@abcengineering.com",
    "phone": "+26650000000",
    "address": "Maseru, Lesotho"
}
```

---

## Get Company

**GET**

```text
/api/companies/{id}/
```

### Allowed Role

ADMIN

---

## Update Company

**PUT/PATCH**

```text
/api/companies/{id}/
```

### Allowed Role

ADMIN

---

## Delete Company

**DELETE**

```text
/api/companies/{id}/
```

### Allowed Role

ADMIN

---

# 9. Assets

Assets belong to clients and are automatically associated with the client's company.

## List Assets

**GET**

```text
/api/assets/
```

### Access

* ADMIN → All assets
* CLIENT → Assets belonging to their company
* TECHNICIAN → Assets belonging to their company, where applicable

---

## Create Asset

**POST**

```text
/api/assets/
```

### Allowed Role

ADMIN

Example:

```json
{
    "client": 2,
    "name": "Industrial Generator",
    "serial_number": "GEN-2026-001",
    "description": "Backup generator"
}
```

The API automatically attaches the client's company.

Example result:

```json
{
    "id": 2,
    "company": 1,
    "company_name": "ABC Engineering",
    "client": 2,
    "client_username": "client1",
    "name": "Industrial Generator",
    "serial_number": "GEN-2026-001",
    "description": "Backup generator",
    "qr_active": true
}
```

---

## Get Asset

**GET**

```text
/api/assets/{id}/
```

---

## Update Asset

**PUT/PATCH**

```text
/api/assets/{id}/
```

---

## Delete Asset

**DELETE**

```text
/api/assets/{id}/
```

---

# 10. Asset QR Codes

Each asset has an associated QR token.

## Generate Asset QR Code

**GET**

```text
/api/assets/{id}/qr/
```

### Allowed Role

ADMIN

The endpoint returns a PNG image containing the QR code.

---

# 11. Scan Asset QR Code

**POST**

```text
/api/qr/scan/{token}/
```

### Allowed Roles

* ADMIN
* TECHNICIAN

The API:

1. Validates the QR token.
2. Checks whether the QR code is active.
3. Records the scan.
4. Records the user.
5. Records the IP address.
6. Records the user agent.
7. Updates the asset's last scan time.

### Successful Response

```json
{
    "message": "QR code scanned successfully.",
    "asset": {
        "id": 2,
        "name": "Industrial Generator",
        "serial_number": "GEN-2026-001",
        "description": "Backup generator",
        "client": 2,
        "client_username": "client1"
    }
}
```

---

# 12. Maintenance Schedules

Maintenance schedules determine when an asset requires maintenance.

## List Schedules

**GET**

```text
/api/maintenance-schedules/
```

### Allowed Role

ADMIN

---

## Create Schedule

**POST**

```text
/api/maintenance-schedules/
```

### Allowed Role

ADMIN

The API automatically calculates the first maintenance date.

Duplicate schedules for the same asset are prevented.

---

## Get Schedule

**GET**

```text
/api/maintenance-schedules/{id}/
```

---

## Update Schedule

**PUT/PATCH**

```text
/api/maintenance-schedules/{id}/
```

---

## Delete Schedule

**DELETE**

```text
/api/maintenance-schedules/{id}/
```

---

# 13. Work Orders

Work orders represent maintenance requests from clients.

## List Work Orders

**GET**

```text
/api/work-orders/
```

### ADMIN

Can see all work orders.

### CLIENT

Can see their own work orders.

### TECHNICIAN

Does not manage work orders.

---

## Create Work Order

**POST**

```text
/api/work-orders/
```

### Client Request

```json
{
    "asset": 2,
    "title": "Industrial Generator Maintenance",
    "description": "Inspect and perform scheduled maintenance."
}
```

The API automatically assigns:

```text
client = authenticated client
company = authenticated client's company
```

### Admin Request

An administrator can create a work order for a client.

```json
{
    "client": 2,
    "asset": 2,
    "title": "Industrial Generator Maintenance",
    "description": "Inspect and perform scheduled maintenance."
}
```

The API automatically determines the company from the client.

---

## Get Work Order

**GET**

```text
/api/work-orders/{id}/
```

---

## Update Work Order

**PUT/PATCH**

```text
/api/work-orders/{id}/
```

---

## Delete Work Order

**DELETE**

```text
/api/work-orders/{id}/
```

---

# 14. Maintenance

Maintenance represents an actual task assigned to a technician.

## List Maintenance

**GET**

```text
/api/maintenance/
```

### ADMIN

Can view all maintenance tasks.

### TECHNICIAN

Can view only maintenance assigned to themselves.

### CLIENT

Does not manage maintenance assignments.

---

## Create Maintenance

**POST**

```text
/api/maintenance/
```

### Allowed Role

ADMIN

Example:

```json
{
    "work_order": 3,
    "technician": 3,
    "description": "Inspect generator and perform scheduled maintenance."
}
```

The API validates that the selected user is actually a technician.

---

## Get Maintenance

**GET**

```text
/api/maintenance/{id}/
```

### Access

* ADMIN
* Assigned TECHNICIAN

---

## Update Maintenance

**PUT/PATCH**

```text
/api/maintenance/{id}/
```

A maintenance task cannot be directly marked as `COMPLETED` unless a completed maintenance report exists.

This ensures the maintenance workflow cannot bypass reporting.

---

# 15. Maintenance Reports

Maintenance reports are created by technicians after performing maintenance.

## List Reports

**GET**

```text
/api/maintenance-reports/
```

### ADMIN

Can see all reports.

### TECHNICIAN

Can see reports for their assigned maintenance.

### CLIENT

Can see reports belonging to their work orders.

---

## Create Maintenance Report

**POST**

```text
/api/maintenance-reports/
```

### Allowed Role

TECHNICIAN

Example:

```json
{
    "maintenance": 3,
    "summary": "Scheduled generator inspection",
    "findings": "Minor wear found on the cooling system.",
    "work_performed": "Inspected and serviced the cooling system.",
    "parts_replaced": "",
    "priority": "MEDIUM",
    "status": "COMPLETED"
}
```

The API prevents:

* Clients from creating reports.
* Technicians from reporting on another technician's maintenance.
* Duplicate reports for the same maintenance task.

---

# 16. Maintenance Report Workflow

The report workflow is:

```text
Work Order
     ↓
Maintenance Assignment
     ↓
Technician Performs Maintenance
     ↓
Technician Creates Report
     ↓
Report COMPLETED
     ↓
Client Reviews Report
     ↓
 ┌───────────────┐
 │               │
 ACCEPT        REJECT
 │               │
 ↓               ↓
Completed      Admin Action
                 ↓
              Reassign
                 ↓
             Technician
```

---

# 17. Client Report Review

## Review Maintenance Report

**POST**

```text
/api/maintenance-reports/{id}/review/
```

### Allowed Role

CLIENT

---

## Accept Report

```json
{
    "action": "ACCEPT",
    "comment": "Maintenance completed successfully."
}
```

### Response

```json
{
    "message": "Maintenance report accepted.",
    "report_id": 3,
    "review_status": "ACCEPTED",
    "review_comment": "Maintenance completed successfully.",
    "requires_admin_action": false
}
```

An accepted report cannot be reviewed again.

---

# 18. Reject Maintenance Report

A client can reject a completed report if the maintenance work is not satisfactory.

### Request

```json
{
    "action": "REJECT",
    "comment": "The cooling system issue was not fully resolved."
}
```

A rejection comment is mandatory.

### Result

The report becomes:

```text
review_status = REJECTED
requires_admin_action = true
```

The maintenance is returned to an active workflow for administrative action.

---

# 19. Rejected Maintenance Reports

## List Rejected Reports

**GET**

```text
/api/maintenance-reports/rejected/
```

### Allowed Role

ADMIN

Only reports that require administrative action are returned.

---

# 20. Reassign Rejected Maintenance

## Reassign

**POST**

```text
/maintenance-reports/{id}/reassign/
```

### Allowed Role

ADMIN

Example:

```json
{
    "technician": 3
}
```

The API:

1. Validates that the report was rejected.
2. Validates that the selected user is a technician.
3. Assigns the maintenance to the new technician.
4. Sets maintenance status to `ASSIGNED`.
5. Resets the report review status to `PENDING`.
6. Clears the previous review comment.
7. Clears the review timestamp.
8. Removes the admin-action flag.
9. Increments the reassignment counter.

Example response:

```json
{
    "message": "Maintenance reassigned successfully.",
    "report_id": 2,
    "maintenance_id": 2,
    "technician": 3,
    "technician_username": "tech",
    "status": "ASSIGNED",
    "reassignment_count": 1
}
```

---

# 21. Report Status

Maintenance reports support:

| Status      | Meaning                                      |
| ----------- | -------------------------------------------- |
| OPEN        | Report has been created but is not completed |
| IN_PROGRESS | Report is being worked on                    |
| COMPLETED   | Technician has completed the report          |

---

# 22. Report Priority

| Priority | Meaning                                     |
| -------- | ------------------------------------------- |
| LOW      | Minor issue                                 |
| MEDIUM   | Normal maintenance issue                    |
| HIGH     | Important issue requiring attention         |
| CRITICAL | Serious issue requiring immediate attention |

---

# 23. Review Status

| Status   | Meaning                    |
| -------- | -------------------------- |
| PENDING  | Waiting for client review  |
| ACCEPTED | Client approved the report |
| REJECTED | Client rejected the report |

---

# 24. Error Handling

The API returns standard HTTP status codes.

| Code | Meaning                 |
| ---- | ----------------------- |
| 200  | Successful request      |
| 201  | Resource created        |
| 400  | Invalid request         |
| 401  | Authentication required |
| 403  | Permission denied       |
| 404  | Resource not found      |
| 405  | HTTP method not allowed |
| 500  | Server error            |

Example validation error:

```json
{
    "detail": "Clients cannot create maintenance reports."
}
```

---

# 25. Authorization Header

Authenticated requests should include:

```http
Authorization: Bearer <access_token>
```

Example:

```http
GET /api/maintenance-reports/
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

---

# 26. Core Business Rules

AssetHub enforces several important business rules at the API level.

### Asset

An asset:

* Must belong to a client.
* Must belong to the client's company.
* Has a QR token.
* Can have its QR code activated/revoked.

### Work Order

A work order:

* Belongs to a client.
* Is associated with an asset.
* Is associated with a company.
* Cannot be created by a technician.

### Maintenance

A maintenance task:

* Belongs to a work order.
* Must be assigned to a technician.
* Cannot be directly completed without a completed report.

### Maintenance Report

A report:

* Belongs to one maintenance task.
* Can only be created once per maintenance task.
* Can only be created by the assigned technician.
* Must be completed before client review.
* Can only be reviewed once per review cycle.
* Can be rejected and sent back for administrative reassignment.

### Reassignment

When a client rejects a report:

```text
REJECTED
   ↓
requires_admin_action = true
   ↓
Admin sees rejected report
   ↓
Admin reassigns technician
   ↓
review_status = PENDING
   ↓
maintenance = ASSIGNED
   ↓
Technician performs maintenance again
```

---

# 27. Example End-to-End Workflow

A typical AssetHub maintenance lifecycle is:

### Step 1 — Admin creates company

```text
POST /api/companies/
```

### Step 2 — Admin creates client

```text
POST /api/users/
```

### Step 3 — Admin creates asset

```text
POST /api/assets/
```

The asset automatically receives the client's company.

### Step 4 — Client creates work order

```text
POST /api/work-orders/
```

### Step 5 — Admin assigns technician

```text
POST /api/maintenance/
```

### Step 6 — Technician performs maintenance

The technician scans the asset QR code:

```text
POST /api/qr/scan/{token}/
```

### Step 7 — Technician creates report

```text
POST /api/maintenance-reports/
```

### Step 8 — Client reviews report

Accept:

```text
POST /api/maintenance-reports/{id}/review/
```

or reject:

```text
POST /api/maintenance-reports/{id}/review/
```

### Step 9 — If rejected

Admin retrieves:

```text
GET /api/maintenance-reports/rejected/
```

### Step 10 — Admin reassigns

```text
POST /maintenance-reports/{id}/reassign/
```

The workflow then starts another maintenance cycle.

---

# 28. API Security Model

AssetHub follows a role-based access control model.

```text
                    ┌──────────────┐
                    │    ADMIN     │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
          Company        Assets      Maintenance
             │                           │
             ↓                           ↓
          Clients                    Technicians
                                         │
                                         ↓
                                   Reports
                                         │
                                         ↓
                                      Client
                                         │
                              ┌──────────┴──────────┐
                              ↓                     ↓
                           ACCEPT                 REJECT
                                                    │
                                                    ↓
                                                   ADMIN
                                                    │
                                                    ↓
                                                REASSIGN
```

---

# 29. Recommended API Testing Order

For Postman testing, use this order:

1. Authentication
2. Company creation
3. Client creation
4. Client profile
5. Asset creation
6. Asset retrieval
7. QR code generation
8. QR scanning
9. Maintenance schedule
10. Work order creation
11. Maintenance assignment
12. Technician maintenance access
13. Maintenance report creation
14. Client report access
15. Client report acceptance
16. Client report rejection
17. Admin rejected-report list
18. Maintenance reassignment
19. Technician receives reassigned maintenance
20. Second maintenance report
21. Client accepts final report

This sequence validates the complete business workflow rather than testing isolated endpoints.

---

# 30. Current API Architecture

```text
                    AssetHub API
                         │
              ┌──────────┴──────────┐
              │                     │
        Authentication          RBAC Layer
              │                     │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Company           Assets          Users
        │                │
        │                └──── QR Codes
        │
        └────────────── Work Orders
                              │
                              ↓
                         Maintenance
                              │
                              ↓
                    Maintenance Reports
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
                 ACCEPT               REJECT
                                        │
                                        ↓
                                     ADMIN
                                        │
                                        ↓
                                   REASSIGN
```

---

## 31. Important Implementation Note

The current API already supports the core maintenance lifecycle:

**Company → Client → Asset → Work Order → Technician → Maintenance → Report → Client Review → Accept/Reject → Reassignment**

This is the primary business workflow of AssetHub and should be treated as the core integration contract when building the frontend/mobile application.
