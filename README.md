# Global IoT Platform Backend

Backend API for the Global IoT Platform.

The backend uses a central **Platform Database** for customer identity, authentication, account types, platform definitions, and Customer Database routing. Each customer has a separate **Customer Database** for customer-specific users, roles, products, devices, and related data.

## Contents

1. Project Details
2. Architecture
3. Prerequisites
4. Project Setup
5. Database Setup
6. API Documentation
7. Current APIs
8. API Testing
9. Database Verification
10. Project Structure
11. Git and Environment Rules
12. Complete Developer Setup
13. Current Development Status
14. Future Scope

---

## 1. Project Details

### Current Scope

The current backend includes:

- Express.js REST API
- MySQL database connectivity
- Platform Database and Customer Database support
- Database schema and seed management
- Platform database migration runner
- Customer database migration/provisioning
- Zod request validation
- Swagger / OpenAPI documentation
- bcrypt password hashing
- Customer registration and Customer Database provisioning
- Customer login
- JWT access-token generation
- JWT authentication middleware
- Current authenticated user API (`GET /api/auth/me`)
- Last-login tracking
- Customer-specific roles
- Platform-defined permissions
- Product creation
- Health-check API

### Technology Stack

- Node.js
- Express.js
- MySQL
- mysql2
- Zod
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

## 2. Architecture

### Database Levels

```text
Platform DB
    |
    └── customer_databases
             |
             ├── Customer DB A
             ├── Customer DB B
             └── Customer DB C
```

### Platform DB

The Platform DB stores global information such as:

```text
account_types
customers
platform_users
platform_login_accounts
platform_roles
platform_user_roles
account_type_upgrade_requests
user_types
permissions
customer_login_accounts
customer_databases
```

Its main responsibilities are:

```text
Customer identity
Authentication records
Account types
Account-type upgrade requests
Platform users and roles
User-type definitions
Permission definitions
Customer Database routing
```

### Customer DB

Each customer has an isolated database containing:

```text
users
roles
role_permissions
user_roles
organizations
locations
products
devices
```

Each Customer DB also contains its own `migration_history` table.

The Customer DB is the tenant boundary. Customer tables do not repeat `customer_id`.

### Cross-Database References

There are no MySQL foreign keys between the Platform DB and a Customer DB.

Application-level references include:

```text
customer_login_accounts.user_public_id
    → Customer DB users.public_id

permissions.code
    → Customer DB role_permissions.permission_code

user_types.code
    → Customer DB users.user_type_code
```

### Customer Database Naming

Customer databases use:

```text
giot_c_<short-generated-id>
```

The database name is separate from both the customer's public UUID and internal numeric customer ID.

### Customer Database Connections

The Platform DB uses a long-lived connection pool.

Customer DB connections are created on demand, cached, reused, and removed after the current inactivity timeout. Pool eviction closes application connections only; it does not delete the Customer DB.

---

## 3. Prerequisites

Install:

1. Node.js
2. npm
3. MySQL Server
4. Git

Verify Node.js and npm:

```bash
node --version
npm --version
```

MySQL must be running and the configured MySQL user must have permission to create and modify the Platform DB and the Customer DBs created by the application.

---

## 4. Project Setup

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

Configure:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=GlobalIoTPlatformDB

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h
```

`.env` is local configuration and must not be committed.

For the current local development setup, the configured MySQL user is used for both the Platform DB and newly provisioned Customer DBs.

---

## 5. Database Setup

### Platform Database Migration

Run:

```bash
npm run db:migrate
```

The migration runner:

1. Connects to MySQL.
2. Creates the configured Platform DB if required.
3. Creates `migration_history`.
4. Executes pending Platform DB schema files in filename order.
5. Executes pending Platform DB seed files in filename order.
6. Records applied files so they are not executed again.

Current Platform DB migration structure:

```text
database/platform/
├── schema/
│   └── 001_create_platform_schema.sql
└── seed/
    ├── 001_seed_account_types.sql
    ├── 002_seed_permissions.sql
    └── 003_seed_user_types.sql
```

### Customer Database Migration

Customer DBs are provisioned during customer registration.

The provisioning flow creates the Customer DB and applies:

```text
database/customer/schema/
├── 001_create_customer_core_schema.sql
└── 002_create_customer_business_device_schema.sql
```

A `migration_history` table inside each Customer DB tracks applied customer migrations.

### Migration Rule

Do not modify an already-applied migration. Create a new migration for future schema changes.

---

## 6. API Documentation

Start the API:

```bash
npm start
```

Open Swagger UI:

```text
http://localhost:3000/api-docs
```

Swagger is the primary reference for current request, response, validation, authentication, and error contracts.

Detailed authentication behavior is documented in:

```text
docs/AUTHENTICATION.md
```

---

## 7. Current APIs

### Health

```http
GET /api/health
```

No authentication required.

### Customer Registration

```http
POST /api/auth/register
```

Creates a customer, provisions its isolated Customer DB, creates the initial Customer Owner, creates the `Customer Super Admin` role, assigns active permissions, creates the login account, and optionally creates an account-type upgrade request.

No authentication required.

### Customer Login

```http
POST /api/auth/login
```

Authenticates the customer user and returns a JWT access token.

No authentication required.

### Current User

```http
GET /api/auth/me
```

Returns the authenticated user's identity and customer context.

Authentication required.

### Product Creation

```http
POST /api/products
```

Creates a product in the authenticated customer's Customer DB.

Authentication required.

---

## 8. API Testing

APIs can be tested with Swagger UI or Postman.

### Authentication Header

Protected APIs use:

```http
Authorization: Bearer <accessToken>
```

### Register Example

```json
{
  "customerName": "Example Customer",
  "requestedAccountType": "Business",
  "customerEmail": "customer@example.com",
  "mobile": "9000000000",
  "address": "Example Address",
  "city": "Example City",
  "state": "Example State",
  "country": "Example Country",
  "pincode": "000000",
  "name": "Example User",
  "email": "user@example.com",
  "password": "Password@123"
}
```

`requestedAccountType`, `address`, `city`, `state`, `country`, and `pincode` are optional.

The default account type is `End User`. A supplied valid account type other than the default creates an upgrade request with status `PENDING`.

### Login Example

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

### Create Product Example

```json
{
  "name": "Example Product",
  "modelNumber": "Example Model",
  "description": "Example product description"
}
```

### Current User

```http
GET /api/auth/me
```

Use the JWT returned by Login.

### Expected Main Responses

Registration:

```text
201 Created
400 Bad Request
409 Conflict
500 Internal Server Error
```

Login:

```text
200 OK
400 Bad Request
401 Unauthorized
500 Internal Server Error
```

Current User:

```text
200 OK
401 Unauthorized
404 Not Found
500 Internal Server Error
```

Product Creation:

```text
201 Created
400 Bad Request
404 Not Found
500 Internal Server Error
```

---

## 9. Database Verification

### Platform DB

```sql
USE GlobalIoTPlatformDB;
SHOW TABLES;
```

Expected application tables:

```text
account_types
account_type_upgrade_requests
customer_databases
customer_login_accounts
customers
migration_history
permissions
platform_login_accounts
platform_roles
platform_user_roles
platform_users
user_types
```

### Find a Customer's Database

```sql
SELECT
    c.public_id AS customer_public_id,
    c.name,
    cd.database_name,
    cd.status,
    cd.provisioning_status
FROM customers c
JOIN customer_databases cd
    ON cd.customer_id = c.id
WHERE c.public_id = '<customer-public-id>';
```

Normal operational state:

```text
status = 1
provisioning_status = ACTIVE
```

### Inspect a Customer DB

After reading the database name from `customer_databases`:

```sql
USE <customer-database-name>;
SHOW TABLES;
```

Expected application tables:

```text
devices
locations
migration_history
organizations
products
role_permissions
roles
user_roles
users
```

### Customer Users

```sql
SELECT
    id,
    public_id,
    name,
    email,
    mobile,
    user_type_code,
    status
FROM users
ORDER BY id DESC
LIMIT 10;
```

### Customer Roles

```sql
SELECT
    id,
    public_id,
    name,
    description,
    status,
    created_by_user_id
FROM roles
ORDER BY id DESC
LIMIT 10;
```

### Role Permissions

```sql
SELECT
    role_id,
    permission_code
FROM role_permissions
WHERE role_id = <role-id>
ORDER BY permission_code;
```

### User Roles

```sql
SELECT
    user_id,
    role_id,
    assigned_at,
    assigned_by_user_id
FROM user_roles
WHERE user_id = <user-id>;
```

### Products

```sql
SELECT
    id,
    public_id,
    name,
    model_number,
    description,
    status,
    created_by_user_id
FROM products
ORDER BY id DESC
LIMIT 10;
```

---

## 10. Project Structure

```text
GlobalIoTPlatform.Backend/
│
├── database/
│   ├── customer/
│   │   └── schema/
│   │       ├── 001_create_customer_core_schema.sql
│   │       └── 002_create_customer_business_device_schema.sql
│   │
│   └── platform/
│       ├── schema/
│       │   └── 001_create_platform_schema.sql
│       └── seed/
│           ├── 001_seed_account_types.sql
│           ├── 002_seed_permissions.sql
│           └── 003_seed_user_types.sql
│
├── scripts/
│   └── migrate.js
│
├── src/
│   ├── config/
│   │   ├── customer-database.js
│   │   ├── database.js
│   │   ├── jwt.js
│   │   └── swagger.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── health.controller.js
│   │   └── product.controller.js
│   │
│   ├── dto/
│   │   ├── auth/
│   │   │   ├── login.dto.js
│   │   │   └── register.dto.js
│   │   └── product/
│   │       └── create-product.dto.js
│   │
│   ├── middleware/
│   │   └── auth.middleware.js
│   │
│   ├── repositories/
│   │   ├── auth/
│   │   │   ├── account-type-upgrade-request.repository.js
│   │   │   ├── account-type.repository.js
│   │   │   └── login-account.repository.js
│   │   ├── customer/
│   │   │   └── customer.repository.js
│   │   ├── customer-database/
│   │   │   └── customer-database.repository.js
│   │   ├── customer-db/
│   │   │   ├── role-permission.repository.js
│   │   │   ├── role.repository.js
│   │   │   ├── user-role.repository.js
│   │   │   └── user.repository.js
│   │   ├── platform/
│   │   │   └── permission.repository.js
│   │   ├── product/
│   │   │   └── product.repository.js
│   │   └── health.repository.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── health.routes.js
│   │   └── product.routes.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── customer-db-connection.service.js
│   │   ├── customer-db-migration.service.js
│   │   ├── customer-db-provisioning.service.js
│   │   ├── health.service.js
│   │   └── product.service.js
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

## 11. Git and Environment Rules

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
passwords
API secrets
private keys
local data exports
```

`.gitignore` should include at least:

```gitignore
node_modules/
.env
npm-debug.log*
.postman/
postman/
```

---

## 12. Complete Developer Setup

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
Register a customer
    ↓
Login
    ↓
Use Bearer token for protected APIs
```

No manual creation of Platform DB application tables is required for a fresh local setup. Customer DB tables are created automatically when a customer is registered.

---

## 13. Current Development Status

```text
Customer Registration              ✅
Customer DB Provisioning           ✅
Customer Login                     ✅
Password Hashing                   ✅
JWT Generation                     ✅
JWT Authentication                 ✅
Current User API (/me)             ✅
Customer-specific Roles            ✅
Permission Assignment              ✅
Last Login Tracking                ✅
Product Creation                   ✅
Swagger Documentation              ✅
```

The current implementation does not yet include permission-based authorization middleware.

---

## 14. Future Scope

Planned modules include:

- Authorization / permission middleware
- Email verification
- Password reset and password change
- Logout / session management
- Account-type approval APIs
- Customer user management
- Customer role management APIs
- Organization management
- Location management
- Device management
- Device access and assignment
- Telemetry
- Device commands
- Audit and common services
