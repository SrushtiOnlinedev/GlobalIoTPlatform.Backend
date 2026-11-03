# Global IoT Platform — API & Database Reference

> Standalone reference for understanding the current backend without reading the full project code or architecture documentation.

## Contents

1. Core Idea
2. Common API Code Flow
3. Register Customer
4. Customer Login
5. Current User
6. Create Product
7. Health Check
8. Platform DB Table Connections
9. Customer DB Table Connections
10. Complete Table Relationship View
11. Cross-Database Connections
12. Simple Mental Model
13. API-to-Database Reference
14. One-Line Summary
15. Device APIs
16. Live Telemetry API

---

## 1. Core Idea

The backend uses **two database levels**:

```text
Platform DB
    ↓
Identifies customers, authentication, account types, permissions,
Customer DB locations, and device-to-customer routing

Customer DB
    ↓
Stores that customer's users, roles, products, devices,
and other customer-specific data. Device MQTT readings are streamed live and are not stored as telemetry history.
```

Main rule:

```text
Authentication / Customer identity
        → Platform DB

Customer-specific data
        → Customer DB
```

A Customer DB is selected using:

```text
JWT customerPublicId
        ↓
Platform DB
        ↓
customer_databases
        ↓
Customer DB
```

---

# 2. Common API Code Flow

Most APIs follow this structure:

```text
API Request
    ↓
Route
    ↓
Controller
    ↓
DTO / Validation (when applicable)
    ↓
Service
    ↓
Repository / DB Resolver
    ↓
Database / Tables
    ↓
Service result
    ↓
Controller response
    ↓
API Response
```

### Main responsibilities

| Layer | Responsibility |
|---|---|
| Route | Maps HTTP method + URL to controller |
| Controller | Handles HTTP request/response and error mapping |
| DTO | Validates request data |
| Service | Contains business flow / orchestration |
| Repository | Executes SQL against tables |
| DB Resolver | Finds and connects to the correct Customer DB |
| Platform DB | Global customer/authentication/platform information |
| Customer DB | Customer-specific application data |

---

# 3. API: Register Customer

## Endpoint

```http
POST /api/auth/register
```

Authentication: **Not required**

## Purpose

Creates a new customer and provisions its isolated Customer DB.

## Request

```json
{
  "customerName": "Example Customer",
  "requestedAccountType": "Business",
  "customerEmail": "contact@example.com",
  "mobile": "9000000000",
  "address": "Example Address",
  "city": "Example City",
  "state": "Example State",
  "country": "India",
  "pincode": "000000",
  "name": "Example User",
  "email": "user@example.com",
  "password": "Password@123"
}
```

`requestedAccountType`, `address`, `city`, `state`, `country`, and `pincode` are optional.

## Code Flow

```text
POST /api/auth/register
        ↓
src/routes/auth.routes.js
        ↓
src/controllers/auth.controller.js
        ↓
src/dto/auth/register.dto.js
        ↓
src/services/auth.service.js
```

## Registration flow inside the service

```text
1. Check login email is not already registered
        ↓
2. Read default account type = End User
        ↓
3. Validate requested account type (if supplied)
        ↓
4. Create customer in Platform DB
        ↓
5. Create Customer DB mapping = PROVISIONING
        ↓
6. Generate Customer DB name
        ↓
7. Create Customer DB
        ↓
8. Apply Customer DB schema
        ↓
9. Create Customer Owner user
        ↓
10. Create Customer Super Admin role
        ↓
11. Read active platform permissions
        ↓
12. Copy permission codes to Customer DB role_permissions
        ↓
13. Assign Super Admin role to Owner user
        ↓
14. Create customer_login_accounts record in Platform DB
        ↓
15. Create account-type upgrade request if requested
        ↓
16. Mark Customer DB mapping = ACTIVE
```

## Main files

```text
src/controllers/auth.controller.js
src/dto/auth/register.dto.js
src/services/auth.service.js
src/services/customer-db-provisioning.service.js
src/services/customer-db-migration.service.js
src/repositories/customer/customer.repository.js
src/repositories/auth/account-type.repository.js
src/repositories/auth/login-account.repository.js
src/repositories/auth/account-type-upgrade-request.repository.js
src/repositories/customer-database/customer-database.repository.js
src/repositories/platform/permission.repository.js
src/repositories/customer-db/user.repository.js
src/repositories/customer-db/role.repository.js
src/repositories/customer-db/role-permission.repository.js
src/repositories/customer-db/user-role.repository.js
```

## Platform DB tables touched

```text
customers
    ↓
customer_databases

customer_login_accounts

account_type_upgrade_requests   ← only when requestedAccountType is supplied
```

`customers.account_type_id` points to `account_types.id`.

## Customer DB tables touched

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

## Registration database picture

```text
PLATFORM DB

account_types
      │
      │ account_type_id
      ▼
customers
      │
      ├──────────────→ customer_databases
      │
      ├──────────────→ customer_login_accounts
      │
      └──────────────→ account_type_upgrade_requests

permissions
      │
      │ permission code is copied
      ▼
CUSTOMER DB

users
  │
  ├────────→ roles.created_by_user_id
  │
  ├────────→ user_roles.user_id
  │
  └────────→ products.created_by_user_id (when products are created)

roles
  │
  ├────────→ role_permissions.role_id
  └────────→ user_roles.role_id
```

## Success response

HTTP `201 Created`

```json
{
  "message": "Customer registered successfully."
}
```

---

# 4. API: Customer Login

## Endpoint

```http
POST /api/auth/login
```

Authentication: **Not required**

## Request

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

## Code Flow

```text
POST /api/auth/login
        ↓
src/routes/auth.routes.js
        ↓
src/controllers/auth.controller.js
        ↓
src/dto/auth/login.dto.js
        ↓
src/services/auth.service.js
        ↓
src/repositories/auth/login-account.repository.js
```

## Database flow

```text
Platform DB
    ↓
customer_login_accounts
    ↓
customers
    ↓
customer_databases
    ↓
Check status = ACTIVE
    ↓
Resolve Customer DB
    ↓
Customer DB
    ↓
users
    ↓
Verify user is active
    ↓
bcrypt password verification
    ↓
Generate JWT
```

## JWT contains

```text
userPublicId
customerPublicId
```

Roles and permissions are **not** stored in the JWT.

## Success response

HTTP `200 OK`

```json
{
  "message": "Login successful.",
  "accessToken": "<jwt-token>",
  "tokenType": "Bearer",
  "expiresIn": "1h"
}
```

---

# 5. API: Current User

## Endpoint

```http
GET /api/auth/me
```

Authentication: **Required**

## Code Flow

```text
GET /api/auth/me
        ↓
src/routes/auth.routes.js
        ↓
auth.middleware.js
        ↓
Verify JWT
        ↓
req.auth
        ↓
src/controllers/auth.controller.js
        ↓
src/services/auth.service.js
```

## Database flow

```text
JWT customerPublicId
        ↓
Platform DB
        ↓
customers
        ↓
customer_databases
        ↓
Resolve Customer DB
        ↓
Customer DB
        ↓
users
        ↓
Build current-user response
```

## Success response shape

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
      "email": "contact@example.com"
    }
  }
}
```

---

# 6. API: Create Product

## Endpoint

```http
POST /api/products
```

Authentication: **Required**

## Request

```json
{
  "name": "Example Product",
  "modelNumber": "MODEL-100",
  "description": "Example product description."
}
```

## Code Flow

```text
POST /api/products
        ↓
src/routes/product.routes.js
        ↓
auth.middleware.js
        ↓
src/controllers/product.controller.js
        ↓
src/dto/product/create-product.dto.js
        ↓
src/services/product.service.js
        ↓
src/services/customer-db-connection.service.js
```

## Database flow

```text
JWT customerPublicId
        ↓
Platform DB
        ↓
customers
        ↓
customer_databases
        ↓
Resolve Customer DB
        ↓
Customer DB
        ├── users
        │     ↓
        │   verify created-by user
        │
        └── products
              ↓
           INSERT product
```

Important:

```text
products does NOT contain customer_id
```

The database itself is the tenant boundary.

## Success response

HTTP `201 Created`

```json
{
  "message": "Product created successfully."
}
```

---

# 7. API: Health Check

## Endpoint

```http
GET /api/health
```

Authentication: Not required

## Flow

```text
GET /api/health
    ↓
src/routes/health.routes.js
    ↓
src/controllers/health.controller.js
    ↓
src/services/health.service.js
    ↓
src/repositories/health.repository.js
    ↓
Platform DB
    ↓
SELECT 1
```

No application table is required.

---

# 8. Platform DB Table Connections

```text
account_types
    │
    └── customers.account_type_id → account_types.id

customers
    │
    ├── customer_databases.customer_id → customers.id
    ├── customer_login_accounts.customer_id → customers.id
    └── account_type_upgrade_requests.customer_id → customers.id

account_type_upgrade_requests
    │
    ├── current_account_type_id → account_types.id
    ├── requested_account_type_id → account_types.id
    └── reviewed_by_platform_user_id → platform_users.id

customer_login_accounts
    │
    └── user_public_id → logical reference to Customer DB users.public_id

customer_databases
    │
    └── database_name / host / port → identifies the Customer DB
```

There are no cross-database foreign keys.

---

# 9. Customer DB Table Connections

```text
users
 │
 ├── parent_user_id → users.id
 ├── user_roles.user_id → users.id
 └── roles.created_by_user_id → users.id

roles
 │
 ├── role_permissions.role_id → roles.id
 ├── user_roles.role_id → roles.id
 └── roles.created_by_user_id → users.id

role_permissions
 │
 └── permission_code → logical reference to Platform permissions.code

user_roles
 │
 ├── user_id → users.id
 ├── role_id → roles.id
 └── assigned_by_user_id → users.id (nullable)

organizations
 │
 ├── parent_organization_id → organizations.id
 └── locations.organization_id → organizations.id

locations
 └── organization_id → organizations.id (nullable)

products
 └── created_by_user_id → users.id

devices
 │
 ├── organization_id → organizations.id (nullable)
 ├── location_id → locations.id (nullable)
 ├── product_id → products.id
 └── created_by_user_id → users.id
```

---

# 10. Complete Table Relationship View

```text
PLATFORM DB

account_types
      │
      ▼
customers
      │
      ├──────────────→ customer_databases
      │
      ├──────────────→ customer_login_accounts
      │                         │
      │                         └── user_public_id
      │
      └──────────────→ account_type_upgrade_requests
                                │
                                ├── current_account_type_id → account_types
                                ├── requested_account_type_id → account_types
                                └── reviewed_by_platform_user_id → platform_users

permissions
      │
      │ code copied as permission_code
      ▼

CUSTOMER DB

users
  │
  ├──────────────→ user_roles
  │                      │
  │                      ▼
  │                    roles
  │                      │
  │                      ▼
  │                role_permissions
  │
  ├──────────────→ organizations
  │                      │
  │                      ▼
  │                   locations
  │
  ├──────────────→ products
  │
  └──────────────────────────────┐
                                 ▼
                              devices
                               │  │  │
                               │  │  └──→ products
                               │  └─────→ locations
                               └────────→ organizations
```

---

# 11. The Most Important Cross-Database Connections

These are **application-level references**, not MySQL foreign keys.

### Customer identity

```text
customers.public_id
        ↓
JWT.customerPublicId
        ↓
customer_databases
        ↓
Customer DB
```

### Login user

```text
customer_login_accounts.user_public_id
        ↓
Customer DB users.public_id
```

### Permission definition

```text
Platform permissions.code
        ↓
Customer DB role_permissions.permission_code
```

### User type definition

```text
Platform user_types.code
        ↓
Customer DB users.user_type_code
```

---

# 12. Simple Mental Model

Remember these four rules:

```text
1. Platform DB answers:
   "Who is this customer and where is its database?"

2. Customer DB answers:
   "What belongs to this customer?"

3. JWT identifies:
   "Which user + which customer is making the request?"

4. Customer DB is selected through:
   customerPublicId → Platform DB → customer_databases
```

---

# 13. Quick API → DB Reference

| API | Platform DB | Customer DB |
|---|---|---|
| `POST /api/auth/register` | `customers`, `customer_databases`, `customer_login_accounts`, optional `account_type_upgrade_requests` | `users`, `roles`, `role_permissions`, `user_roles` |
| `POST /api/auth/login` | `customer_login_accounts`, `customers`, `customer_databases` | `users` |
| `GET /api/auth/me` | `customers`, `customer_databases` | `users` |
| `POST /api/products` | customer routing | `users`, `products` |
| `GET /api/products` | customer routing | `products` |
| `POST /api/devices` | customer routing, `device_database_routes`, `device_mqtt_credentials` | `users`, `products`, `devices` |
| `GET /api/devices` | customer routing | `users`, `products`, `devices` |
| `GET /api/devices/{devicePublicId}` | customer routing | `users`, `products`, `devices` |
| `GET /api/devices/{devicePublicId}/live` | customer routing, `device_database_routes` (MQTT ingestion path) | `users`, `devices` (validation) |
| `GET /api/health` | connectivity check only | — |

---

# 14. One-Line Summary

```text
Request → Route → Controller → DTO/Middleware → Service → Repository/DB Resolver → Platform DB or Customer DB → Response
```


---

# 15. Device APIs

Device records are stored in the authenticated customer's Customer DB. The Platform DB separately maps each device code to its customer so the MQTT subscriber can route telemetry to the correct Customer DB.

## Register Device

Endpoint:

```http
POST /api/devices
```

Authentication: Bearer JWT plus `DEVICE_MANAGE` permission.

Request example:

```json
{
  "deviceName": "Example Temperature Sensor",
  "serialNumber": "SENSOR-EXAMPLE-001",
  "modelNumber": "EXAMPLE-MODEL-001",
  "productPublicId": "<product-public-id>",
  "remarks": "Example device registration"
}
```

The `productPublicId` must identify an active product in the same Customer DB. Organization and location fields may be supplied only when they satisfy the API's existing ownership/relationship validation. Refer to Swagger for the current request schema.

### Registration flow

```text
POST /api/devices
        ↓
Authenticate JWT and check DEVICE_MANAGE
        ↓
Resolve Customer DB from customerPublicId
        ↓
Validate user, product, and optional organization/location
        ↓
Create device in Customer DB and generate deviceCode
        ↓
Create deviceCode → customer route in Platform DB
        ↓
Provision unique MQTT client and publisher role
        ↓
Save MQTT connection metadata in Platform DB
        ↓
Return device identifiers and MQTT connection details
```

### Database responsibilities

| Database | Table | Responsibility |
|---|---|---|
| Customer DB | `devices` | Device record, product relationship, optional organization/location, creator, status, and device code. |
| Platform DB | `device_database_routes` | Maps the generated device code to the owning customer for MQTT routing. |
| Platform DB | `device_mqtt_credentials` | Stores MQTT connection metadata such as host, port, client ID, username, topic, and status. It does not store the generated device password. |

The device registration success response contains `devicePublicId`, `deviceCode`, and an `mqtt` object. The generated MQTT password is returned for the device to use; store it securely and do not include it in documentation or source control.

The backend attempts cleanup if provisioning fails. The precise error response and request schema are documented in Swagger.

## List Devices

Endpoint:

```http
GET /api/devices?page=1&pageSize=20
```

Authentication: Bearer JWT plus `DEVICE_DATA_VIEW` permission.

Returns devices belonging to the authenticated customer's Customer DB. The response includes device/product details and live connection fields such as `lastSeenAt` and `connectionStatus`.

## Get Device Details

Endpoint:

```http
GET /api/devices/{devicePublicId}
```

Authentication: Bearer JWT plus `DEVICE_DATA_VIEW` permission.

The API resolves the device within the authenticated customer's Customer DB. A public ID from another customer must not be used to bypass customer isolation.

## Device Connection Fields

| Field | Meaning |
|---|---|
| `lastSeenAt` | Timestamp of the latest valid telemetry reading received by the current backend process; `null` before a reading is received. |
| `connectionStatus` | `Registered` before a reading, `Connected` while the latest reading is within the configured timeout, or `Disconnected` after it becomes stale. |

The current connection-state data is held in memory, so it is reset when the backend process restarts. See `docs/MQTT_AND_LIVE_TELEMETRY.md`.

---

# 16. Live Telemetry API

Endpoint:

```http
GET /api/devices/{devicePublicId}/live
```

Authentication: Bearer JWT plus `DEVICE_DATA_VIEW` permission.

The client supplies the device public ID. The backend validates the authenticated user and device, retrieves the device code from the Customer DB record, then subscribes the HTTP response to that customer's in-memory live telemetry stream.

### Data flow

```text
Device MQTT publisher
        ↓
Mosquitto broker
        ↓
Backend MQTT subscriber
        ↓
Validate topic, device code, and payload
        ↓
Resolve deviceCode through Platform DB device_database_routes
        ↓
Verify device in the routed Customer DB
        ↓
Publish to in-memory live telemetry service
        ↓
SSE response to authorized client
```

### SSE event shape

The endpoint responds with `Content-Type: text/event-stream` and leaves the connection open. A reading is delivered as an event similar to:

```text
event: telemetry
data: {"deviceCode":"DEV-XXXXXXXX","payload":{"temperature":26.5,"humidity":58},"receivedAt":"<iso-8601-timestamp>"}
```

This is a stream, not a normal one-time JSON response. Swagger UI may continue loading while the connection is open. Use Postman or `curl -N` to inspect events.

### Telemetry persistence rule

The current implementation keeps live readings and connection state in memory only. It does not insert every MQTT reading into a database history table. Readings are lost when the backend restarts. Do not add telemetry persistence unless the project requirement is explicitly changed.

For broker setup, per-device MQTT provisioning, ACLs, message validation, Postman/curl commands, and troubleshooting, see [`MQTT_AND_LIVE_TELEMETRY.md`](MQTT_AND_LIVE_TELEMETRY.md).
