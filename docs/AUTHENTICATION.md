# Global IoT Platform — Authentication

## Contents

1. Authentication Overview
2. Authentication Concepts
3. Registration API
4. Registration and Database Flow
5. Login API
6. JWT and Current User API
7. Protected API Behavior
8. Testing
9. Future Authentication Scope

---

## 1. Authentication Overview

The platform separates global customer authentication data from customer-specific user and role data.

### Current Scope

- Customer registration
- Isolated Customer DB provisioning
- Initial Customer Owner creation
- Customer-specific `Customer Super Admin` role creation
- Permission assignment
- Customer login using email and password
- Password hashing with bcrypt
- JWT access-token generation
- JWT authentication middleware
- Current authenticated user API (`GET /api/auth/me`)
- Last-login tracking
- Authorization / permission middleware
- Swagger / OpenAPI documentation

### Planned Scope

- Email verification
- Password reset and password change
- Logout / session management

---

## 2. Authentication Concepts

| Concept | Meaning |
|---|---|
| **Customer Account Type** | Type of the customer account. Current values: `End User`, `Organization / Company`, `Business`, `Individual`, `Other`. |
| **User Type** | Platform-defined type stored as `user_type_code` inside the Customer DB. Current codes include `CUSTOMER_OWNER`, `EMPLOYEE`, `SUB_USER`, and `EXTERNAL_USER`. |
| **Role** | Customer-specific access definition stored in the Customer DB. |
| **Permission** | Platform-defined capability identified by a stable permission code. |
| **Login Account** | Platform DB authentication record containing login email and password hash. |

### Initial Customer User

During registration:

```text
Customer Owner user
        ↓
Customer Super Admin role
        ↓
All currently active permission codes
```

The initial user's user type code is:

```text
CUSTOMER_OWNER
```

The role name is:

```text
Customer Super Admin
```

The role is customer-specific and is stored in that customer's Customer DB.

### Database Separation

```text
Platform DB
├── customers
├── customer_login_accounts
├── customer_databases
├── account_types
├── user_types
└── permissions

Customer DB
├── users
├── roles
├── role_permissions
└── user_roles
```

There are no cross-database foreign keys.

Application-level references are used for customer user public IDs, user type codes, and permission codes.

---

## 3. Registration API

### Endpoint

```http
POST /api/auth/register
```

### Authentication

Not required.

### Purpose

Creates a customer and provisions its isolated Customer DB and initial authenticated user.

### Request Example

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

### Required Fields

```text
customerName
customerEmail
mobile
name
email
password
```

### Validation

```text
customerName       → 2–200 characters
customerEmail      → valid email, maximum 320 characters
mobile             → 7–30 characters
name               → 2–200 characters
email              → valid email, maximum 320 characters
```

Optional text fields use their configured maximum lengths.

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

The customer is initially created as:

```text
End User
```

If `requestedAccountType` is omitted:

```text
Registration
    ↓
Actual Account Type = End User
    ↓
No upgrade request
```

If a different valid account type is supplied:

```text
requestedAccountType = Business

Actual Account Type    = End User
Requested Account Type = Business
Upgrade Request        = PENDING
```

The requested account type does not become active automatically.

Valid current account types are:

```text
End User
Organization / Company
Business
Individual
Other
```

### Registration Response

#### 201 Created

```json
{
  "message": "Customer registered successfully."
}
```

#### 400 Bad Request — Validation

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

#### 400 Bad Request — Invalid Account Type

```json
{
  "message": "Invalid requested account type."
}
```

#### 409 Conflict

```json
{
  "message": "Registration cannot be completed with the provided details."
}
```

The same generic conflict response is used for duplicate login email conditions.

#### 500 Internal Server Error

```json
{
  "message": "An unexpected error occurred."
}
```

Detailed internal errors are not returned to the client.

---

## 4. Registration and Database Flow

Registration crosses the Platform DB and a new Customer DB, so there is no single MySQL transaction covering the entire process.

### Backend Flow

```text
POST /api/auth/register
        ↓
Route
        ↓
Controller
        ↓
Zod Validation
        ↓
Check duplicate login email
        ↓
Read default account type = End User
        ↓
Validate requested account type when supplied
        ↓
Create Customer in Platform DB
        ↓
Create customer_databases mapping = PROVISIONING
        ↓
Generate Customer DB name
        ↓
Create Customer DB
        ↓
Apply Customer DB schema/migrations
        ↓
Create Customer Owner user
        ↓
Create Customer Super Admin role
        ↓
Read active Platform permissions
        ↓
Assign permission codes in Customer DB
        ↓
Assign role to Customer Owner
        ↓
Create customer_login_accounts record in Platform DB
        ↓
Create upgrade request when required
        ↓
Mark Customer DB mapping = ACTIVE
        ↓
201 Created
```

### Failure Handling

If provisioning fails after the mapping exists:

```text
Error
  ↓
customer_databases.provisioning_status = FAILED
  ↓
Failure time and error are recorded
```

The implementation does not use a cross-database transaction. Incomplete resources may be cleaned up separately; established customer data must not be blindly deleted.

### Platform DB Tables Touched

```text
customers
    ↓
customer_databases

customer_login_accounts

account_type_upgrade_requests   ← only when required
```

`customers.account_type_id` stores the customer's current account type.

### Customer DB Tables Touched

```text
users
    ↓
roles
    ↓
role_permissions

users
    ↓
user_roles
```

### Permission Model

Platform DB:

```text
permissions.code
```

Customer DB:

```text
role_permissions.permission_code
```

The permission code is an application-level reference. There is no cross-database foreign key.

---

## 5. Login API

### Endpoint

```http
POST /api/auth/login
```

### Authentication

Not required.

### Purpose

Authenticates an existing customer user and returns a JWT access token.

### Request

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

Both fields are required.

### Login Flow

```text
Email + Password
      ↓
Find customer_login_accounts
      ↓
Check login account status
      ↓
Check customer status
      ↓
Check Customer DB status and provisioning status
      ↓
Resolve Customer DB
      ↓
Find user by user_public_id
      ↓
Check user status
      ↓
Verify password with bcrypt
      ↓
Update last_login_at
      ↓
Generate JWT
      ↓
200 OK
```

Authentication failures use a generic response.

### Login Response

#### 200 OK

```json
{
  "message": "Login successful.",
  "accessToken": "<jwt-token>",
  "tokenType": "Bearer",
  "expiresIn": "1h"
}
```

#### 400 Bad Request

Used for invalid request data.

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

Used for authentication failure, including unknown email, incorrect password, inactive records, or an unavailable Customer DB.

```json
{
  "message": "Invalid credentials."
}
```

#### 500 Internal Server Error

```json
{
  "message": "An unexpected error occurred."
}
```

### Last Login

On successful login, `customer_login_accounts.last_login_at` is updated.

---

## 6. JWT and Current User API

### JWT Payload

The current token contains:

```json
{
  "userPublicId": "<user-public-id>",
  "customerPublicId": "<customer-public-id>"
}
```

Roles and permissions are not stored in the JWT.

### Token Configuration

```env
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h
```

The secret is local configuration and must not be committed.

### Authentication Middleware

Protected APIs use:

```http
Authorization: Bearer <accessToken>
```

The middleware:

```text
Request
   ↓
Read Authorization header
   ↓
Extract Bearer token
   ↓
Verify JWT
   ↓
Set req.auth
   ↓
Continue
```

Missing or invalid authentication returns `401 Unauthorized`.

### Current User API

#### Endpoint

```http
GET /api/auth/me
```

Authentication required.

#### Request Body

No request body.

#### Database Flow

```text
JWT.customerPublicId
        ↓
Platform DB
        ↓
customers
        ↓
customer_databases
        ↓
Resolve Customer DB
        ↓
Customer DB users
        ↓
Build response
```

The account type is read from the Platform DB. The user type is read from the Customer DB.

#### Successful Response — 200 OK

```json
{
  "message": "Current user retrieved successfully.",
  "user": {
    "userPublicId": "<user-public-id>",
    "name": "Example User",
    "email": "user@example.com",
    "mobile": "9000000000",
    "userType": "CUSTOMER_OWNER",
    "accountType": "End User",
    "customer": {
      "customerPublicId": "<customer-public-id>",
      "name": "Example Customer",
      "email": "customer@example.com"
    }
  }
}
```

#### 401 Unauthorized — Missing Token

```json
{
  "message": "Authentication required."
}
```

#### 401 Unauthorized — Invalid or Expired Token

```json
{
  "message": "Invalid or expired token."
}
```

#### 404 Not Found

```json
{
  "message": "User not found."
}
```

#### 500 Internal Server Error

```json
{
  "message": "An unexpected error occurred."
}
```

---

## 7. Protected API Behavior

### Create Product

```http
POST /api/products
```

Authentication required.

Request:

```json
{
  "name": "Example Product",
  "modelNumber": "Example Model",
  "description": "Example product description"
}
```

Flow:

```text
JWT
  ↓
customerPublicId
  ↓
Platform DB
  ↓
customer_databases
  ↓
Customer DB
  ↓
users
  ↓
Verify authenticated user
  ↓
products
  ↓
Create product
```

The product is stored only in the authenticated customer's Customer DB.

The current endpoint authenticates the user but does not yet enforce a permission such as `PRODUCT_MANAGE`. Permission-based authorization is the next stage.

---

## 8. Testing

### Register — Success

```http
POST http://localhost:3000/api/auth/register
```

Use the generic request example above.

Expected:

```text
201 Created
```

### Register — Invalid Account Type

Use a value that is not one of the platform-defined account types.

Expected:

```text
400 Bad Request
```

```json
{
  "message": "Invalid requested account type."
}
```

No customer or Customer DB should be created for this validation failure.

### Register — Duplicate Email

Use an already-registered login email.

Expected:

```text
409 Conflict
```

### Login — Success

```http
POST http://localhost:3000/api/auth/login
```

Expected:

```text
200 OK
```

Save the returned `accessToken` for protected requests.

### Login — Wrong Password or Unknown Email

Expected:

```text
401 Unauthorized
```

```json
{
  "message": "Invalid credentials."
}
```

### Current User

```http
GET http://localhost:3000/api/auth/me
```

Use:

```http
Authorization: Bearer <accessToken>
```

### Protected API Without Token

Expected:

```text
401 Unauthorized
```

```json
{
  "message": "Authentication required."
}
```

### Protected API With Invalid Token

Expected:

```text
401 Unauthorized
```

```json
{
  "message": "Invalid or expired token."
}
```

---

## 9. Future Authentication Scope

Current flow:

```text
Login
  ↓
JWT
  ↓
Authentication Middleware
  ↓
Authenticated User Context
  ↓
Protected API
```

Next:

```text
Authenticated User Context
  ↓
Load Customer Roles
  ↓
Resolve Permission Codes
  ↓
Authorization / permission middleware
  ↓
Allow / Deny API Access
```

Planned authentication/security features:

```text
Email Verification
Password Reset / Change
Logout / Session Management
```
