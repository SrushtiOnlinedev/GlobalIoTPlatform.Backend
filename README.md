# Global IoT Platform Backend

Backend API for the Global IoT Platform.


1. Project Details
2. Prerequisites
3. Project Setup
4. Database Setup
5. Database Structure
6. Role Model
7. Run the API
8. Customer Registration
9. Registration Flow
10. Account Type Behavior
11. Registration Response
12. Registration Tests
13. Database Verification
14. Directory Structure
15. Git and Environment Rules
16. Complete Developer Setup
17. Future Scope


## 1. Project Details

### Current Scope

The current backend includes:

- Express.js REST API
- MySQL database connectivity
- Database schema and seed management
- Database migration runner
- Zod request validation
- Swagger / OpenAPI documentation
- bcrypt password hashing
- Customer registration
- Customer-specific roles and permissions
- Health-check API

Authentication login/JWT, email verification, and other modules will be added in later stages.

### Technology Stack

- Node.js
- Express.js
- MySQL
- mysql2
- Zod(schema validation library)
- bcrypt
- Swagger JSDoc
- Swagger UI Express

### Development Versions

- Node.js: 24.x
- npm: 11.x
- MySQL: 8.x

Exact package versions are defined in `package.json` and `package-lock.json`.

---

## 2. Prerequisites

Install:

1. Node.js
2. npm
3. MySQL Server
4. Git

Verify:

```bash
node --version
npm --version
```

MySQL must be running and the configured MySQL user must have permission to create the project database and tables.

---

## 3. Project Setup

### Clone Repository

```bash
git clone https://github.com/SrushtiOnlinedev/GlobalIoTPlatform.Backend.git
cd GlobalIoTPlatform.Backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create `.env` from `.env.example`.

#### Git Bash

```bash
cp .env.example .env
```

#### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Configure `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=GlobalIoTPlatformDB
```

`.env` is local and must not be committed.

---

## 4. Database Setup

Run:

```bash
npm run db:migrate
```

The migration runner:

1. Connects to MySQL.
2. Creates `GlobalIoTPlatformDB` if required.
3. Creates `migration_history`.
4. Executes pending schema files in filename order.
5. Records applied schema files.
6. Executes pending seed files in filename order.
7. Records applied seed files.

### Schema Files

```text
database/schema/
├── 001_create_core_schema.sql
├── 002_create_customer_core_schema.sql
└── 003_create_business_device_schema.sql
```

### Seed Files

```text
database/seed/
├── 001_seed_account_types.sql
├── 002_seed_permissions.sql
└── 003_seed_user_types.sql
```

Already-applied files are skipped automatically.

### Future Database Changes

Do not modify an already-applied migration.

Create a new migration:

```text
database/schema/
├── 001_create_core_schema.sql
├── 002_create_customer_core_schema.sql
├── 003_create_business_device_schema.sql
└── 004_add_email_verification.sql
```

Then run:

```bash
npm run db:migrate
```

Only the new migration will be applied.

---

## 5. Database Structure

Current application tables:

```text
account_types
account_type_upgrade_requests
companies
customer_login_accounts
customers
devices
permissions
products
role_permissions
roles
user_roles
user_types
users
```

### Main Relationship

```text
customers
├── users
│   ├── user_type → user_types
│   └── user_roles → roles
│                  └── role_permissions → permissions
│
└── customer_login_accounts
    ├── customer_id → customers
    └── user_id → users

account_types
├── customer_login_accounts.actual_account_type_id
└── account_type_upgrade_requests

account_type_upgrade_requests
├── current_account_type_id → account_types
└── requested_account_type_id → account_types
```

### Account Type, User Type and Role

```text
Customer Account Type → type of customer account
User Type             → type of user
Role                  → actions available to the user
Permission            → individual allowed action
```

The default account type is currently `End User`.

---

## 6. Role Model

Roles are customer-specific.

The platform provides permissions, while each customer can create its own roles.

Example:

```text
Customer A
├── Customer Super Admin
├── Technician
└── Viewer

Customer B
├── Customer Super Admin
└── Sales
```

During registration, the first user receives:

```text
User Type: Customer Owner
Role: Customer Super Admin
```

The customer-specific Super Admin role receives all currently active permissions.

---

## 7. Run the API

Start the server:

```bash
npm start
```

Expected:

```text
Server running at http://localhost:3000
```

Swagger:

```text
http://localhost:3000/api-docs
```

Health API:

```http
GET /api/health
```

Swagger can be used as the main development API testing interface.

---

# API Documentation

## 8. Customer Registration

### Endpoint

```http
POST /api/auth/register
```

### Authentication

Not required.

### Purpose

Creates:

- Customer
- First customer user
- Customer Super Admin role
- Role permissions
- User-role assignment
- Customer login account
- Optional account-type upgrade request

### Request

```json
{
  "customerName": "Amit Patel",
  "requestedAccountType": "Business",
  "customerEmail": "amit.customer@example.com",
  "mobile": "9876543210",
  "address": "123 Main Road",
  "city": "Surat",
  "state": "Gujarat",
  "country": "India",
  "pincode": "395001",
  "name": "Amit Patel",
  "email": "amit@example.com",
  "password": "Password@123"
}
```

### Required Fields

```text
customerName
customerEmail
mobile
name
email
password
```

### Optional Fields

```text
requestedAccountType
address
city
state
country
pincode
```

### Password Policy

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

Example:

```text
Password@123
```

---

## 9. Registration Flow

```text
POST /api/auth/register
        ↓
Zod Validation
        ↓
Auth Service
        ↓
BEGIN TRANSACTION
        ↓
Default Account Type
        ↓
Customer
        ↓
Customer Super Admin Role
        ↓
Role Permissions
        ↓
Customer Owner User
        ↓
User Role
        ↓
Password Hash
        ↓
Login Account
        ↓
Optional Upgrade Request
        ↓
COMMIT
```

If any operation fails:

```text
Error
 ↓
ROLLBACK
```

This prevents partial registration.

---

## 10. Account Type Behavior

### Without Account Type Request

```text
Actual Account Type = End User
Upgrade Request = None
```

### With Account Type Request

Example:

```json
{
  "requestedAccountType": "Business"
}
```

Result:

```text
Actual Account Type     = End User
Requested Account Type  = Business
Upgrade Request Status  = Pending
```

The requested account type does not become active automatically.

---

## 11. Registration Response

### Success

HTTP `201 Created`

```json
{
  "message": "Customer registered successfully."
}
```

### Validation Error

HTTP `400 Bad Request`

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

### Invalid Account Type

HTTP `400 Bad Request`

```json
{
  "message": "Invalid requested account type."
}
```

### Duplicate Registration

HTTP `409 Conflict`

```json
{
  "message": "Registration cannot be completed with the provided details."
}
```

The API does not reveal whether a specific email already belongs to an account.

### Unexpected Error

HTTP `500 Internal Server Error`

```json
{
  "message": "An unexpected error occurred."
}
```

Detailed errors are logged server-side and are not returned to the client.

---

# Testing

## 12. Registration Tests

Use unique email addresses for successful registration tests.

### Test 1 — Successful Registration

Request:

```json
{
  "customerName": "Final Test Customer",
  "customerEmail": "final.customer@example.com",
  "mobile": "9876543215",
  "name": "Final Test User",
  "email": "final.user@example.com",
  "password": "Password@123"
}
```

Expected:

```text
HTTP 201 Created
```

```json
{
  "message": "Customer registered successfully."
}
```

Database:

```text
customers                    → 1 new row
users                        → 1 new row
roles                        → 1 customer Super Admin role
role_permissions             → active permissions assigned
user_roles                   → 1 role assignment
customer_login_accounts      → 1 new row
account_type_upgrade_requests → no new row
```

### Test 2 — Business Account Request

Request:

```json
{
  "customerName": "Business Test Customer",
  "requestedAccountType": "Business",
  "customerEmail": "business.customer@example.com",
  "mobile": "9876543216",
  "name": "Business Test User",
  "email": "business.user@example.com",
  "password": "Password@123"
}
```

Expected:

```text
HTTP 201 Created

Actual Account Type    = End User
Requested Account Type = Business
Upgrade Status         = Pending
```

### Test 3 — Invalid Password

Request:

```json
{
  "customerName": "Validation Test",
  "customerEmail": "validation@example.com",
  "mobile": "9876543217",
  "name": "Validation User",
  "email": "validation.user@example.com",
  "password": "password"
}
```

Expected:

```text
HTTP 400 Bad Request
```

### Test 4 — Duplicate Email

Use an email already registered.

Expected:

```text
HTTP 409 Conflict
```

```json
{
  "message": "Registration cannot be completed with the provided details."
}
```

### Test 5 — Invalid Account Type

Request:

```json
{
  "customerName": "Invalid Type Test",
  "requestedAccountType": "SomethingRandom",
  "customerEmail": "invalid.type@example.com",
  "mobile": "9876543218",
  "name": "Invalid Type User",
  "email": "invalid.type.user@example.com",
  "password": "Password@123"
}
```

Expected:

```text
HTTP 400 Bad Request
```

```json
{
  "message": "Invalid requested account type."
}
```

---

## 13. Database Verification

Connect to MySQL:

```sql
USE GlobalIoTPlatformDB;
```

Latest customer:

```sql
SELECT *
FROM customers
ORDER BY id DESC
LIMIT 1;
```

Latest user:

```sql
SELECT *
FROM users
ORDER BY id DESC
LIMIT 1;
```

Latest role:

```sql
SELECT *
FROM roles
ORDER BY id DESC
LIMIT 1;
```

Latest role assignment:

```sql
SELECT *
FROM user_roles
ORDER BY assigned_at DESC
LIMIT 1;
```

Latest login account:

```sql
SELECT *
FROM customer_login_accounts
ORDER BY id DESC
LIMIT 1;
```

Latest upgrade request:

```sql
SELECT *
FROM account_type_upgrade_requests
ORDER BY id DESC
LIMIT 1;
```

Role permissions:

```sql
SELECT
    r.id,
    r.customer_id,
    r.name,
    p.code
FROM roles r
JOIN role_permissions rp
    ON rp.role_id = r.id
JOIN permissions p
    ON p.id = rp.permission_id
WHERE r.id = (
    SELECT MAX(id)
    FROM roles
)
ORDER BY p.id;
```

---

# Project Structure

## 14. Directory Structure

```text
GlobalIoTPlatform.Backend/
│
├── database/
│   ├── schema/
│   │   ├── 001_create_core_schema.sql
│   │   ├── 002_create_customer_core_schema.sql
│   │   └── 003_create_business_device_schema.sql
│   │
│   └── seed/
│       ├── 001_seed_account_types.sql
│       ├── 002_seed_permissions.sql
│       └── 003_seed_user_types.sql
│
├── scripts/
│   └── migrate.js
│
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── swagger.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── health.controller.js
│   │
│   ├── dto/
│   │   └── auth/
│   │       └── register.dto.js
│   │
│   ├── repositories/
│   │   ├── auth/
│   │   ├── customer/
│   │   ├── user/
│   │   └── health.repository.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── health.routes.js
│   │
│   └── services/
│       ├── auth.service.js
│       └── health.service.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

---

## 15. Git and Environment Rules

### Commit

Safe to commit:

```text
Source code
SQL schema files
SQL seed files
Migration scripts
.env.example
README.md
package.json
package-lock.json
```

### Do Not Commit

```text
.env
node_modules/
Passwords
API secrets
Private keys
Local data exports
```

`.gitignore` should contain at least:

```gitignore
node_modules/
.env
npm-debug.log*
```

---

## 16. Complete Developer Setup

```text
git clone
    ↓
cd GlobalIoTPlatform.Backend
    ↓
npm install
    ↓
Create .env
    ↓
Configure MySQL credentials
    ↓
npm run db:migrate
    ↓
npm start
    ↓
Open /api-docs
    ↓
Test API
```

No manual creation of the application tables is required for a fresh local setup.

---

## 17. Future Scope

Planned modules include:

- Login API
- JWT authentication
- Email verification
- Password reset/change
- Session/token management
- Account-type approval workflow
- Customer role management
- Company management
- Product management
- Device management
- Device access and assignment
- Telemetry
- Device commands
- Audit and common services