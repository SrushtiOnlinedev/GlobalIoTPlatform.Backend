# Global IoT Platform Backend

Backend API for the Global IoT Platform.

## Contents

1. Project Details
2. Prerequisites
3. Project Setup
4. Database Setup
5. Database Structure
6. Role Model
7. Run the API
8. API Documentation
9. API Testing
10. Database Verification
11. Project Structure
12. Git and Environment Rules
13. Complete Developer Setup
14. Authentication Development Status
15. Future Scope


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
- Customer login
- JWT access-token generation
- JWT authentication middleware
- Current authenticated user API (`GET /api/auth/me`)
- Last-login tracking
- Customer-specific roles and permissions
- Health-check API

Remaining authentication features such as authorization middleware, email verification, password management, and session management will be added in later stages.

### Technology Stack

- Node.js
- Express.js
- MySQL
- mysql2
- Zod (schema validation library)
- bcrypt
- jsonwebtoken
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

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h
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

### Main Relationships

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
Role                  → user access definition
Permission            → individual allowed action
Login Account         → authentication credentials
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
User Type = Customer Owner
Role      = Customer Super Admin
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

### Swagger

```text
http://localhost:3000/api-docs
```

### Health API

```http
GET /api/health
```

Swagger can be used as the main development API testing interface.

---

## 8. API Documentation

### Authentication APIs

The current authentication APIs are:

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

The `/me` API requires a valid JWT Bearer token.

### Health API

```http
GET /api/health
```

Detailed authentication documentation is available here:

[Authentication Documentation](docs/AUTHENTICATION.md)

The authentication documentation contains:

* Registration API
* Login API
* Request and response formats
* Validation rules
* Registration flow
* Login flow
* Database flow
* JWT behavior
* Authentication error handling
* Testing scenarios
* Future authentication scope

---

## 9. API Testing

APIs can be tested using:

* Swagger UI
* Postman

### Register

```http
POST http://localhost:3000/api/auth/register
```

### Login

```http
POST http://localhost:3000/api/auth/login
```

### Current User

```http
GET http://localhost:3000/api/auth/me
```

Use the JWT returned by Login:

```http
Authorization: Bearer <accessToken>
```

Swagger or Postman can be used to test the protected endpoint.

Authentication request/response examples and test scenarios are documented in:

[Authentication Documentation](docs/AUTHENTICATION.md)

---

## 10. Database Verification

Connect to MySQL:

```sql
USE GlobalIoTPlatformDB;
```

### Check Tables

```sql
SHOW TABLES;
```

### Latest Customer

```sql
SELECT *
FROM customers
ORDER BY id DESC
LIMIT 1;
```

### Latest User

```sql
SELECT *
FROM users
ORDER BY id DESC
LIMIT 1;
```

### Latest Role

```sql
SELECT *
FROM roles
ORDER BY id DESC
LIMIT 1;
```

### Latest Role Assignment

```sql
SELECT *
FROM user_roles
ORDER BY assigned_at DESC
LIMIT 1;
```

### Latest Login Account

```sql
SELECT *
FROM customer_login_accounts
ORDER BY id DESC
LIMIT 1;
```

### Latest Upgrade Request

```sql
SELECT *
FROM account_type_upgrade_requests
ORDER BY id DESC
LIMIT 1;
```

### Role Permissions

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

## 11. Project Structure

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
│   │   ├── jwt.js
│   │   └── swagger.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── health.controller.js
│   │
│   ├── dto/
│   │   └── auth/
│   │       ├── register.dto.js
│   │       └── login.dto.js
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
│   ├── services/
│   │   ├── auth.service.js
│   │   └── health.service.js
│   │
│   └── utils/
│       └── jwt.util.js
│
├── docs/
│   └── AUTHENTICATION.md
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

---

## 12. Git and Environment Rules

### Safe to Commit

```text
Source code
SQL schema files
SQL seed files
Migration scripts
.env.example
README.md
docs/
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
.postman/
postman/
```

---

## 13. Complete Developer Setup

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

## 14. Authentication Development Status

Current:

```text
Customer Registration       ✅
Customer Login              ✅
Password Hashing            ✅
JWT Generation              ✅
JWT Authentication          ✅
Current User API (/me)      ✅
Customer-specific Roles     ✅
Permission Assignment       ✅
Last Login Tracking         ✅
Swagger Documentation       ✅
```

Planned:

```text
Authorization Middleware
Email Verification
Password Reset / Change
Logout / Session Management
```

See:

[Authentication Documentation](docs/AUTHENTICATION.md)

for the detailed authentication design and current API behavior.

---

## 15. Future Scope

Planned platform modules include:

* Authorization / permission middleware
* Email verification
* Password reset and change
* Logout / session management
* Account-type approval workflow
* Customer role management
* Company management
* Product management
* Device management
* Device access and assignment
* Telemetry
* Device commands
* Audit and common services
