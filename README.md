# AssetHub API

AssetHub is a role-based asset and maintenance management API built with **Django** and **Django REST Framework (DRF)**.

The system is designed to manage company assets, work orders, maintenance schedules, technician assignments, QR-code asset identification, maintenance reports, and client reviews.

The API uses **JWT authentication** and a role-based access-control model consisting of:

* **Administrator**
* **Technician**
* **Client**

---

## 1. System Overview

AssetHub provides a centralized backend for managing the complete asset-maintenance lifecycle.

### Core workflow

```text
Admin
  │
  ├── Creates Client
  ├── Creates Technician
  ├── Creates Asset
  ├── Generates Asset QR Code
  ├── Creates Work Order
  │
  └── Assigns Maintenance
          │
          ▼
      Technician
          │
          ├── Views assigned maintenance
          ├── Performs maintenance
          └── Creates Maintenance Report
                    │
                    ▼
                  Client
                    │
             ┌──────┴──────┐
             │             │
           ACCEPT        REJECT
             │             │
             ▼             ▼
          Complete       Admin
                           │
                           └── Reassigns maintenance
                                  │
                                  ▼
                              Technician
```

---

# 2. Technology Stack

| Technology            | Purpose                      |
| --------------------- | ---------------------------- |
| Python                | Backend programming language |
| Django                | Web framework                |
| Django REST Framework | REST API                     |
| Simple JWT            | Authentication               |
| SQLite/PostgreSQL     | Database                     |
| QRCode                | QR-code generation           |
| Postman               | API testing                  |

---

# 3. User Roles

AssetHub uses three primary roles.

## Administrator

The administrator has the highest level of access.

Administrators can:

* Create users
* Delete users
* Manage clients
* Manage technicians
* Create assets
* Update assets
* Delete assets
* Generate asset QR codes
* Create work orders
* Assign maintenance
* Create maintenance schedules
* View all maintenance
* View all maintenance reports
* View rejected reports
* Reassign rejected maintenance

---

## Technician

Technicians are responsible for performing assigned maintenance.

Technicians can:

* View their assigned maintenance
* Scan asset QR codes
* Create maintenance reports
* Update maintenance information
* Complete maintenance
* View reports associated with their maintenance

Technicians cannot:

* Create users
* Manage clients
* Create work orders
* Manage maintenance schedules
* Reassign maintenance

---

## Client

Clients can view information related to their own assets and maintenance.

Clients can:

* View their assets
* View their work orders
* View maintenance reports for their assets
* Accept maintenance reports
* Reject maintenance reports
* Provide rejection comments

Clients cannot:

* Create maintenance reports
* Assign technicians
* Manage assets
* Manage users
* Reassign maintenance

---

# 4. Authentication

AssetHub uses **JWT Bearer authentication**.

## Obtain access token

```http
POST /api/auth/token/
```

Request:

```json
{
    "username": "imagen",
    "password": "your-password"
}
```

Response:

```json
{
    "refresh": "refresh-token",
    "access": "access-token"
}
```

Use the access token in subsequent requests:

```http
Authorization: Bearer <access-token>
```

---

## Refresh access token

```http
POST /api/auth/token/refresh/
```

Request:

```json
{
    "refresh": "your-refresh-token"
}
```

---

## Current user

```http
GET /api/auth/me/
```

Returns information about the authenticated user.

---

# 5. API Endpoints

## Authentication

| Method | Endpoint                   | Purpose      |
| ------ | -------------------------- | ------------ |
| POST   | `/api/auth/token/`         | Login        |
| POST   | `/api/auth/token/refresh/` | Refresh JWT  |
| GET    | `/api/auth/me/`            | Current user |

---

# 6. User Management

## List/Create Users

```http
GET /api/users/
POST /api/users/
```

Administrator access is required.

### Create user

```json
{
    "username": "tech",
    "password": "password123",
    "role": "TECHNICIAN"
}
```

---

## User Detail

```http
GET /api/users/<id>/
PATCH /api/users/<id>/
DELETE /api/users/<id>/
```

Administrator only.

---

# 7. Asset Management

## List Assets

```http
GET /api/assets/
```

### Administrator

Returns all assets.

### Client

Returns only assets belonging to that client.

### Technician

Direct asset-list access is restricted.

---

## Create Asset

```http
POST /api/assets/
```

Administrator only.

Example:

```json
{
    "client": 2,
    "name": "Industrial Generator",
    "serial_number": "GEN-2026-001",
    "description": "Backup generator"
}
```

---

## Asset Detail

```http
GET /api/assets/<id>/
PATCH /api/assets/<id>/
DELETE /api/assets/<id>/
```

Administrators can access all assets.

Clients can access their own assets.

---

# 8. QR Code System

Every asset can have an associated QR code.

The QR code contains a secure asset token that points to the AssetHub QR scanning endpoint.

## Generate QR Code

```http
GET /api/assets/<asset_id>/qr/
```

Administrator only.

The endpoint returns:

```text
image/png
```

---

## Scan QR Code

```http
POST /api/qr/scan/<token>/
```

Available to:

* Administrator
* Technician

The system records:

* Asset
* User
* Scan result
* IP address
* User agent
* Scan timestamp

Successful scans update the asset's `last_qr_scan_at` value.

---

# 9. Work Orders

Work orders connect clients, assets, and maintenance activities.

## List/Create Work Orders

```http
GET /api/work-orders/
POST /api/work-orders/
```

Administrators can view all work orders.

Clients can view their own work orders.

Technicians do not manage work orders.

---

## Work Order Detail

```http
GET /api/work-orders/<id>/
PATCH /api/work-orders/<id>/
DELETE /api/work-orders/<id>/
```

Administrators can access all work orders.

Clients can access their own work orders.

---

# 10. Maintenance Schedules

Maintenance schedules define when an asset should receive maintenance.

## List/Create Schedule

```http
GET /api/maintenance-schedules/
POST /api/maintenance-schedules/
```

Administrator only.

Example:

```json
{
    "asset": 1,
    "frequency": "MONTHLY"
}
```

The system automatically calculates the next maintenance date.

An asset cannot have duplicate active maintenance schedules.

---

## Schedule Detail

```http
GET /api/maintenance-schedules/<id>/
PATCH /api/maintenance-schedules/<id>/
DELETE /api/maintenance-schedules/<id>/
```

Administrator only.

---

# 11. Maintenance

Maintenance represents an actual maintenance task assigned to a technician.

## List Maintenance

```http
GET /api/maintenance/
```

### Administrator

Returns all maintenance tasks.

### Technician

Returns only maintenance assigned to the authenticated technician.

---

## Create Maintenance

```http
POST /api/maintenance/
```

Administrator only.

Example:

```json
{
    "work_order": 1,
    "technician": 3,
    "description": "Inspect generator and perform scheduled maintenance",
    "status": "ASSIGNED"
}
```

The selected user must have the `TECHNICIAN` role.

---

## Maintenance Detail

```http
GET /api/maintenance/<id>/
PATCH /api/maintenance/<id>/
```

Administrators can access all maintenance.

Technicians can access their assigned maintenance.

---

# 12. Maintenance Reports

A maintenance report records what the technician found and what work was performed.

A report is associated with a maintenance task.

## List Reports

```http
GET /api/maintenance-reports/
```

### Administrator

Sees all reports.

### Technician

Sees reports for their assigned maintenance.

### Client

Sees reports associated with their own work orders/assets.

---

## Create Report

```http
POST /api/maintenance-reports/
```

Technicians can create reports for their assigned maintenance.

Example:

```json
{
    "maintenance": 1,
    "summary": "Scheduled generator inspection",
    "findings": "Minor wear found on the cooling system.",
    "work_performed": "Inspected and serviced the cooling system.",
    "parts_replaced": "",
    "priority": "MEDIUM",
    "status": "COMPLETED"
}
```

A technician cannot create a report for another technician's maintenance task.

A maintenance task cannot have duplicate reports.

---

# 13. Maintenance Report Status

Reports support a lifecycle that controls client review.

Typical flow:

```text
IN_PROGRESS
     │
     ▼
COMPLETED
     │
     ▼
Client Review
   /      \
  /        \
ACCEPT     REJECT
  │          │
  ▼          ▼
Approved    Admin Action
```

A client cannot review a report until the report has been marked:

```text
COMPLETED
```

---

# 14. Maintenance Report Detail

```http
GET /api/maintenance-reports/<id>/
PATCH /api/maintenance-reports/<id>/
```

Access is filtered according to the user's role.

### Administrator

Can access all reports.

### Technician

Can access reports belonging to their maintenance.

### Client

Can access reports associated with their own work orders.

---

# 15. Client Report Review

Clients can accept or reject completed maintenance reports.

## Review Endpoint

```http
POST /api/maintenance-reports/<id>/review/
```

Only the client associated with the work order can review the report.

---

## Accept Report

Request:

```json
{
    "action": "ACCEPT",
    "comment": "Maintenance completed successfully."
}
```

The report becomes:

```text
ACCEPTED
```

---

## Reject Report

Request:

```json
{
    "action": "REJECT",
    "comment": "The cooling system still requires additional repairs."
}
```

The report becomes:

```text
REJECTED
```

A rejection requires a comment.

The system sets:

```text
requires_admin_action = true
```

The maintenance task is returned to an assignable state so the administrator can decide what to do next.

---

# 16. Rejected Maintenance Workflow

A rejected report is escalated to the administrator.

The workflow is:

```text
Technician
    │
    ▼
Maintenance
    │
    ▼
Report COMPLETED
    │
    ▼
Client Reviews
    │
    └── REJECTED
            │
            ▼
      Admin Action Required
            │
       ┌────┴────┐
       │         │
 Same Tech   New Tech
       │         │
       └────┬────┘
            ▼
       Maintenance
       ASSIGNED
            │
            ▼
       Technician
            │
            ▼
       New Report
```

This prevents a rejected maintenance report from being treated as a completed job.

---

# 17. Rejected Reports

Administrators can retrieve reports requiring administrative action.

```http
GET /api/maintenance-reports/rejected/
```

Expected records have:

```json
{
    "review_status": "REJECTED",
    "requires_admin_action": true
}
```

---

# 18. Reassign Maintenance

Administrators can reassign rejected maintenance to the same technician or another technician.

```http
POST /api/maintenance-reports/<id>/reassign/
```

Example:

```json
{
    "technician": 3
}
```

Or assign another technician:

```json
{
    "technician": 4
}
```

The selected user must have the `TECHNICIAN` role.

After reassignment, the maintenance should return to:

```text
ASSIGNED
```

The technician can then perform the work again.

---

# 19. Permission Matrix

| Feature               | Admin | Technician | Client |
| --------------------- | :---: | :--------: | :----: |
| Login                 |   ✓   |      ✓     |    ✓   |
| View own profile      |   ✓   |      ✓     |    ✓   |
| Manage users          |   ✓   |      ✗     |    ✗   |
| Create assets         |   ✓   |      ✗     |    ✗   |
| View own assets       |   ✓   |      ✗     |    ✓   |
| Generate QR           |   ✓   |      ✗     |    ✗   |
| Scan QR               |   ✓   |      ✓     |    ✗   |
| Manage work orders    |   ✓   |      ✗     |   Own  |
| Manage schedules      |   ✓   |      ✗     |    ✗   |
| Create maintenance    |   ✓   |      ✗     |    ✗   |
| View maintenance      |   ✓   |     Own    |    ✗   |
| Create reports        |   ✓   |     Own    |    ✗   |
| View reports          |  All  |     Own    |   Own  |
| Review reports        |   ✗   |      ✗     |    ✓   |
| Reject reports        |   ✗   |      ✗     |    ✓   |
| View rejected reports |   ✓   |      ✗     |    ✗   |
| Reassign maintenance  |   ✓   |      ✗     |    ✗   |

---

# 20. Error Responses

The API uses standard HTTP status codes.

| Status | Meaning                               |
| ------ | ------------------------------------- |
| 200    | Successful request                    |
| 201    | Resource created                      |
| 400    | Invalid request                       |
| 401    | Authentication required/invalid token |
| 403    | Insufficient permissions              |
| 404    | Resource not found                    |
| 500    | Server error                          |

Example validation error:

```json
{
    "maintenance": [
        "Invalid pk \"1\" - object does not exist."
    ]
}
```

This means the referenced maintenance record does not exist.

---

# 21. Project Structure

A typical project structure is:

```text
AssetHub/
│
├── backend/
│   │
│   ├── manage.py
│   │
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   └── api/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── permissions.py
│       ├── urls.py
│       ├── admin.py
│       └── migrations/
│
└── README.md
```

---

# 22. Installation

Clone the project and enter the backend directory.

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install qrcode
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Create an administrator:

```bash
python manage.py createsuperuser
```

Start the development server:

```bash
python manage.py runserver
```

The API will be available at:

```text
http://127.0.0.1:8000/
```

---

# 23. Database Migrations

Whenever models are changed:

```bash
python manage.py makemigrations
```

Then:

```bash
python manage.py migrate
```

If Django reports a migration problem, check:

```bash
python manage.py showmigrations
```

---

# 24. Django System Check

Before running the API, verify the project:

```bash
python manage.py check
```

A successful result should indicate:

```text
System check identified no issues
```

---

# 25. Postman Testing

The recommended testing sequence is:

### Step 1 — Login

```http
POST /api/auth/token/
```

### Step 2 — Create client/technician

```http
POST /api/users/
```

### Step 3 — Create asset

```http
POST /api/assets/
```

### Step 4 — Generate QR

```http
GET /api/assets/1/qr/
```

### Step 5 — Create work order

```http
POST /api/work-orders/
```

### Step 6 — Assign maintenance

```http
POST /api/maintenance/
```

### Step 7 — Technician views maintenance

```http
GET /api/maintenance/
```

### Step 8 — Technician creates report

```http
POST /api/maintenance-reports/
```

### Step 9 — Client views report

```http
GET /api/maintenance-reports/
```

### Step 10 — Client accepts/rejects

```http
POST /api/maintenance-reports/1/review/
```

### Step 11 — Admin checks rejected reports

```http
GET /api/maintenance-reports/rejected/
```

### Step 12 — Admin reassigns

```http
POST /api/maintenance-reports/1/reassign/
```

---

# 26. Development Workflow

Recommended development workflow:

```text
1. Update models
       ↓
2. Create migrations
       ↓
3. Run migrations
       ↓
4. Update serializers
       ↓
5. Update permissions
       ↓
6. Update views
       ↓
7. Update URLs
       ↓
8. Run django check
       ↓
9. Start server
       ↓
10. Test in Postman
       ↓
11. Connect frontend
```

---

# 27. Security Considerations

AssetHub uses several security controls:

* JWT authentication
* Role-based permissions
* Object-level access restrictions
* Client ownership checks
* Technician assignment checks
* QR token validation
* QR revocation
* QR scan logging
* Rejection workflow
* Administrative reassignment

Clients cannot access another client's assets or maintenance reports.

Technicians cannot access maintenance assigned to another technician.

---

# 28. API Design Principles

The API follows REST-style conventions:

* `GET` retrieves resources
* `POST` creates resources/actions
* `PATCH` partially updates resources
* `DELETE` removes resources

Authentication is handled through JWT.

Authorization is handled through DRF permission classes and role-based business logic.

---

# 29. Future Enhancements

Potential future improvements include:

* File/image uploads for maintenance reports
* PDF maintenance report generation
* Email notifications
* Push notifications
* Maintenance reminders
* Dashboard analytics
* Asset maintenance history
* QR scan analytics
* Audit logs
* Search and filtering
* Pagination
* API documentation with Swagger/OpenAPI
* PostgreSQL production deployment
* Cloud file storage
* Frontend integration
* Mobile application integration

---

# 30. Production Deployment

The Django development server should not be used for production.

For production, consider:

```text
Frontend
    │
    ▼
Vercel / Cloud Hosting
    │
    ▼
Django REST API
    │
    ▼
PostgreSQL
    │
    ├── Users
    ├── Assets
    ├── Work Orders
    ├── Maintenance
    ├── Reports
    └── QR Scan Logs
```

Production deployment should also configure:

* `DEBUG=False`
* Secure secret key
* Allowed hosts
* HTTPS
* Production database
* CORS
* Secure cookies
* Environment variables
* Static/media storage
* Database backups

---

# 31. API Status

Current AssetHub API capabilities:

* [x] JWT authentication
* [x] Role-based access control
* [x] User management
* [x] Asset management
* [x] QR code generation
* [x] QR scanning
* [x] QR scan logging
* [x] Maintenance schedules
* [x] Work orders
* [x] Technician assignment
* [x] Maintenance reports
* [x] Client report review
* [x] Report acceptance
* [x] Report rejection
* [x] Admin rejected-report workflow
* [x] Maintenance reassignment
* [x] Role-based maintenance filtering

---

# 32. Conclusion

AssetHub provides a centralized API for managing assets and their maintenance lifecycle.

The platform establishes a controlled workflow between administrators, technicians, and clients:

```text
Asset
  ↓
Work Order
  ↓
Maintenance
  ↓
Technician
  ↓
Maintenance Report
  ↓
Client Review
  ↓
┌───────────────┐
│               │
ACCEPT        REJECT
│               │
▼               ▼
Complete       Admin
                 ↓
             Reassign
                 ↓
             Technician
```

This architecture provides a scalable foundation for connecting the AssetHub API to a web dashboard, mobile application, or other client applications.
