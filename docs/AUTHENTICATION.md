# Global IoT Platform — Authentication

## Contents

1. Authentication Overview
2. Authentication Concepts
3. Registration API
4. Registration Flow & Database Flow
5. Login API
6. Login Flow, JWT & Responses
7. Testing
8. Future Authentication Scope


## 1. Authentication Overview

This document describes the current authentication design and API flow for the Global IoT Platform backend.

### Current Scope

- Customer registration
- Initial customer user creation
- Customer-specific Super Admin role creation
- Permission assignment
- Login using email and password
- Password hashing with bcrypt
- JWT access-token generation
- Last-login tracking
- Swagger / OpenAPI documentation

### Planned Scope

- Protected profile (`/api/auth/me`) API
- JWT authentication middleware
- Authorization / permission middleware
- Email verification
- Password reset and change
- Logout / session management

---

## 2. Authentication Concepts

The platform separates customer account identity, user identity, roles, permissions, and login credentials.

| Concept | Meaning |
|---|---|
| **Customer Account Type** | Type of the customer account, such as `End User`, `Business`, `Individual`, or `Organization / Company`. |
| **User Type** | Type of user within the customer account, such as `Customer Owner`, `Employee`, `Sub User`, or `External User`. |
| **Role** | Customer-specific access definition assigned to a user. |
| **Permission** | Individual action that a role can perform. |
| **Login Account** | Authentication record containing login email and password hash. |

### Simple Relationship

```text
Customer Account Type → Customer account
User Type             → User/person type
Role                  → User access definition
Permission            → Individual allowed action
Login Account         → Authentication credentials
````

### Initial Customer User

The first user created during registration is automatically:

```text
User Type = Customer Owner
Role      = Customer Super Admin
```

The `Customer Super Admin` role is created specifically for that customer.

Customer-specific roles can be created later by the customer.

---

## 3. Registration API

### Endpoint

```http
POST /api/auth/register
```

### Authentication

Not required.

### Purpose

Creates a new customer account and its initial customer user.

The registration process creates:

```text
Customer
   ↓
Customer Owner User
   ↓
Customer Super Admin Role
   ↓
Role Permissions
   ↓
User-Role Assignment
   ↓
Login Account
   ↓
Optional Account-Type Upgrade Request
```

### Request Example

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

### Validation

General validation:

```text
customerName → 2–200 characters
customerEmail → valid email, maximum 320 characters
mobile → 7–30 characters
name → 2–200 characters
email → valid email, maximum 320 characters
```

Optional text fields are validated according to their configured maximum lengths.

### Password Policy

```text
Minimum 8 characters
At least 1 uppercase letter
At least 1 lowercase letter
At least 1 number
At least 1 special character
```

Example:

```text
Password@123
```

### Account-Type Behavior

The requested account type is treated as an account upgrade request.

The customer is initially created with the current default account type:

```text
End User
```

#### No Account Type Selected

```text
Registration
   ↓
Actual Account Type = End User
   ↓
No upgrade request
```

#### Account Type Selected

Example:

```text
requestedAccountType = Business
```

Result:

```text
Actual Account Type    = End User
Requested Account Type = Business
Upgrade Request        = Pending
```

The requested account type does not become active automatically.

Only platform-defined account types can be requested.

### Registration Responses

#### 201 Created

```json
{
  "message": "Customer registered successfully."
}
```

#### 400 Bad Request

Used for invalid request data or an invalid requested account type.

Validation example:

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

Invalid account type:

```json
{
  "message": "Invalid requested account type."
}
```

#### 409 Conflict

Used when registration cannot be completed with the provided details, including duplicate login email.

```json
{
  "message": "Registration cannot be completed with the provided details."
}
```

The API does not reveal whether a specific email already belongs to an account.

#### 500 Internal Server Error

```json
{
  "message": "An unexpected error occurred."
}
```

Detailed internal errors are not returned to the client.

---

## 4. Registration Flow & Database Flow

### Backend Flow

```text
Client / Swagger / Postman
        ↓
POST /api/auth/register
        ↓
Route
        ↓
Controller
        ↓
Zod Validation
        ↓
Authentication Service
        ↓
BEGIN TRANSACTION
        ↓
Validate Default Account Type
        ↓
Validate Customer Owner User Type
        ↓
Create Customer
        ↓
Create Customer Super Admin Role
        ↓
Assign Active Permissions
        ↓
Create Customer Owner User
        ↓
Assign Super Admin Role
        ↓
Hash Password with bcrypt
        ↓
Create Login Account
        ↓
Check Optional Requested Account Type
        ↓
Create Upgrade Request when required
        ↓
COMMIT
        ↓
201 Created
```

If an operation fails:

```text
Error
  ↓
ROLLBACK
```

This prevents partial registration data.

### Database Flow

```text
customers
    ↓
users
    ├── user_type → user_types
    └── user_roles → roles
                       ↓
                role_permissions
                       ↓
                  permissions

customer_login_accounts
    ├── customer_id → customers
    ├── user_id → users
    └── actual_account_type_id → account_types

account_type_upgrade_requests
    ├── customer_id → customers
    ├── current_account_type_id → account_types
    └── requested_account_type_id → account_types
```

### Table Responsibilities

| Table                           | Responsibility                                  |
| ------------------------------- | ----------------------------------------------- |
| `customers`                     | Stores customer account information.            |
| `users`                         | Stores customer users.                          |
| `user_types`                    | Provides predefined user types.                 |
| `roles`                         | Stores customer-specific roles.                 |
| `permissions`                   | Stores platform-defined permissions.            |
| `role_permissions`              | Assigns permissions to roles.                   |
| `user_roles`                    | Assigns roles to users.                         |
| `customer_login_accounts`       | Stores login email and password hash.           |
| `account_types`                 | Stores platform-defined customer account types. |
| `account_type_upgrade_requests` | Stores optional account-type upgrade requests.  |

### Role Model

Roles are customer-specific.

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

The platform defines permissions, while each customer can create its own roles.

The initial `Customer Super Admin` role receives all currently active permissions during registration.

---

## 5. Login API

### Endpoint

```http
POST /api/auth/login
```

### Authentication

Not required.

### Purpose

Authenticates an existing customer user and issues a JWT access token.

### Request

```json
{
  "email": "final.user@example.com",
  "password": "Password@123"
}
```

Both fields are required.

### Login Rules

```text
Email + Password
      ↓
Find Login Account
      ↓
Check Login Account / Customer / User status
      ↓
Verify Password with bcrypt
      ↓
Update last_login_at
      ↓
Generate JWT
      ↓
200 OK
```

Authentication failures use the same response so the API does not expose which authentication condition failed.

### Login Responses

#### 200 OK

```json
{
  "message": "Login successful.",
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": "1h"
}
```

#### 400 Bad Request

Used when the login request format is invalid.

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

#### 401 Unauthorized

Used for authentication failure, including unknown email, incorrect password, or inactive login/customer/user records.

```json
{
  "message": "Invalid credentials."
}
```

The same message is used for all authentication failures.

#### 500 Internal Server Error

```json
{
  "message": "An unexpected error occurred."
}
```

Detailed internal errors are not returned to the client.

---

## 6. Login Flow, JWT & Responses

### Login Database Flow

The login process uses the following relationships:

```text
customer_login_accounts
        ↓
customers
        ↓
users
        ↓
user_types
        ↓
account_types
```

Roles and permissions are maintained through:

```text
users
   ↓
user_roles
   ↓
roles
   ↓
role_permissions
   ↓
permissions
```

The Login API currently focuses on credential verification and access-token issuance.

### JWT Payload

The current JWT contains only the identifiers required to identify the authenticated context:

```json
{
  "userPublicId": "...",
  "customerPublicId": "..."
}
```

Roles and permissions are not stored in the JWT.

### Token Configuration

Configured through environment variables:

```env
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h
```

The actual secret is stored only in `.env` and must not be committed to Git.

### Token Usage

Protected APIs will use:

```http
Authorization: Bearer <accessToken>
```

### Authentication vs Authorization

```text
Authentication
→ Who is the user?

Authorization
→ What is the user allowed to do?
```

The JWT identifies the authenticated user and customer.

Roles and permissions are used for authorization and will be handled through protected APIs and authorization middleware.

---

## 7. Testing

Testing can be performed using Swagger or Postman.

### Register

```http
POST http://localhost:3000/api/auth/register
```

#### Test: Successful Registration

```json
{
  "customerName": "Postman Test Customer",
  "customerEmail": "postman.customer@example.com",
  "mobile": "9876543220",
  "name": "Postman Test User",
  "email": "postman.user@example.com",
  "password": "Password@123"
}
```

Expected:

```text
201 Created
```

```json
{
  "message": "Customer registered successfully."
}
```

Database result:

```text
customers                     → new row
users                         → new row
roles                         → customer Super Admin role
role_permissions              → active permissions assigned
user_roles                    → role assigned to user
customer_login_accounts       → new login account
account_type_upgrade_requests → no new row
```

#### Test: Business Account Request

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
201 Created

Actual Account Type    = End User
Requested Account Type = Business
Upgrade Request        = Pending
```

#### Test: Invalid Password

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
400 Bad Request
```

#### Test: Duplicate Email

Use an email that already exists.

Expected:

```text
409 Conflict
```

```json
{
  "message": "Registration cannot be completed with the provided details."
}
```

#### Test: Invalid Account Type

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
400 Bad Request
```

```json
{
  "message": "Invalid requested account type."
}
```

### Login

```http
POST http://localhost:3000/api/auth/login
```

#### Test: Successful Login

```json
{
  "email": "final.user@example.com",
  "password": "Password@123"
}
```

Expected:

```text
200 OK
```

```json
{
  "message": "Login successful.",
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": "1h"
}
```

Verify last login:

```sql
SELECT
    id,
    email,
    last_login_at
FROM customer_login_accounts
WHERE email = 'final.user@example.com';
```

`last_login_at` should contain the latest successful login time.

#### Test: Wrong Password

```json
{
  "email": "final.user@example.com",
  "password": "WrongPassword@123"
}
```

Expected:

```text
401 Unauthorized
```

```json
{
  "message": "Invalid credentials."
}
```

#### Test: Unknown Email

```json
{
  "email": "doesnotexist@example.com",
  "password": "Password@123"
}
```

Expected:

```text
401 Unauthorized
```

```json
{
  "message": "Invalid credentials."
}
```

The unknown-email and wrong-password responses are intentionally identical.

### Database Verification

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

## 8. Future Authentication Scope

The next authentication steps are:

```text
Login
  ↓
JWT Authentication Middleware
  ↓
GET /api/auth/me
  ↓
Authenticated User Context
  ↓
Authorization Middleware
  ↓
Permission-based Protected APIs
```

### Planned Features

```text
GET /api/auth/me
→ Retrieve authenticated user/account information

JWT Middleware
→ Validate Bearer access tokens

Authorization Middleware
→ Check customer-specific roles and permissions

Email Verification
→ Verify the user's email before enabling the related account flow

Password Reset / Change
→ Secure password management

Logout / Session Management
→ Token/session lifecycle management
```

Email verification is not part of the current registration/login flow and can be added later.