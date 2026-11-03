# Global IoT Platform Backend

Backend API for the Global IoT Platform. The platform supports different customer types, including businesses, factories, shops, developers, and individual/home users.

The backend uses a central **Platform Database** for customer identity, authentication, platform definitions, and routing. Each customer has an isolated **Customer Database** for that customer's users, roles, organizations, locations, products, and devices.

## Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Prerequisites](#4-prerequisites)
5. [Project Setup](#5-project-setup)
6. [Environment Configuration](#6-environment-configuration)
7. [Database Setup](#7-database-setup)
8. [API Reference](#8-api-reference)
9. [End-to-End API Test Flow](#9-end-to-end-api-test-flow)
10. [MQTT and Live Telemetry](#10-mqtt-and-live-telemetry)
11. [Security and Data Handling](#11-security-and-data-handling)
12. [Database Verification](#12-database-verification)
13. [Project Structure](#13-project-structure)
14. [Current Project Status](#14-current-project-status)
15. [Future Scope](#15-future-scope)

---

## 1. Project Overview

The backend is responsible for:

- Customer registration and isolated Customer Database provisioning.
- Customer login and JWT authentication.
- Customer-specific roles and permission-based authorization.
- Product and device registration and retrieval.
- Device-to-customer database routing.
- Per-device MQTT access provisioning.
- MQTT telemetry validation and live delivery through Server-Sent Events (SSE).
- API health checking and Swagger documentation.

The frontend is developed separately and communicates with this backend through REST APIs and the live telemetry SSE endpoint.

## 2. Architecture

### Database separation

```text
                    Platform Database
                            |
       ┌────────────────────┼─────────────────────┐
       |                    |                     |
   Customers        Login / Permissions     Device DB Routes
       |                                          |
       |                                          | deviceCode → customer
       ▼                                          ▼
  Customer DB A                              Customer DB B ...
  - users                                     - users
  - roles                                     - roles
  - products                                  - products
  - devices                                   - devices
```

**Platform Database** stores platform-wide customer identity, login accounts, account types, platform users/roles, permission definitions, Customer Database mappings, device routing, and MQTT credential metadata.

**Customer Database** stores data belonging to one customer, including users, roles, role permissions, user-role assignments, organizations, locations, products, and devices. The Customer Database is the tenant boundary; customer tables do not repeat `customer_id` unless a specific relationship requires it.

There are no MySQL foreign keys across the Platform Database and a Customer Database. Cross-database relationships are resolved by the application.

### Device routing

```text
MQTT topic: devices/{deviceCode}/telemetry
                  |
                  ▼
          Backend MQTT Subscriber
                  |
          Validate topic and payload
                  |
          Platform DB device route
                  |
          Resolve customer database
                  |
          Confirm device exists
                  |
          Live Telemetry Service (memory)
                  |
                  ▼
           SSE client connection
```

The device code format is `DEV-XXXXXXXX`, where the eight characters are uppercase hexadecimal characters.

### Live telemetry behavior

- MQTT telemetry is validated and delivered to connected SSE clients.
- The latest reading and connection state are maintained in application memory.
- Live MQTT readings are **not inserted into a telemetry history table**.
- In-memory readings are cleared when the backend process restarts.
- Device connection state is derived from the most recent received reading and `DEVICE_CONNECTION_TIMEOUT_SECONDS`.

See [MQTT and Live Telemetry](docs/MQTT_AND_LIVE_TELEMETRY.md) for the full flow and test instructions.

## 3. Technology Stack

- Node.js 24.x
- Express.js
- MySQL 8.x and `mysql2`
- Zod
- `bcrypt`
- `jsonwebtoken`
- MQTT.js
- Mosquitto MQTT broker with the Dynamic Security plugin
- Swagger JSDoc and Swagger UI Express

Exact package versions are maintained in `package.json` and `package-lock.json`.

## 4. Prerequisites

Install and configure:

1. Node.js 24.x and npm 11.x.
2. MySQL Server 8.x.
3. Git.
4. Mosquitto broker with the Dynamic Security plugin for device MQTT provisioning and telemetry testing.
5. Mosquitto command-line clients (`mosquitto_pub`) for local telemetry publishing tests.

Verify Node.js and npm:

```bash
node --version
npm --version
```

MySQL must be running. The configured MySQL user needs permission to create and modify the Platform Database and the Customer Databases provisioned by the application.

## 5. Project Setup

### Clone the repository

```bash
git clone https://github.com/SrushtiOnlinedev/GlobalIoTPlatform.Backend.git
cd GlobalIoTPlatform.Backend
```

### Install dependencies

```bash
npm install
```

### Create local environment configuration

Git Bash:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` with the local database, JWT, and MQTT settings described below. Do not commit `.env`.

### Apply Platform Database migrations and start the backend

```bash
npm run db:migrate
npm start
```

The backend runs at `http://localhost:3000`. Swagger UI is available at `http://localhost:3000/api-docs`.

Customer Database provisioning and its migrations are performed during customer registration.

## 6. Environment Configuration

The `.env.example` file lists the configuration keys. Set real local values only in `.env`.

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Platform Database connection. The configured MySQL user is also used when provisioning Customer Databases in the current local setup. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT signing secret and token lifetime. |
| `MQTT_HOST`, `MQTT_PORT` | Broker address and port used by the backend subscriber and backend provisioning connection. |
| `MQTT_USERNAME`, `MQTT_PASSWORD` | Broker account used by the backend telemetry subscriber. |
| `MQTT_TOPIC` | Subscriber topic filter; current default is `devices/+/telemetry`. |
| `DEVICE_CONNECTION_TIMEOUT_SECONDS` | Time after the last reading at which a device is considered disconnected; current default is `120`. |
| `MQTT_ADMIN_USERNAME`, `MQTT_ADMIN_PASSWORD` | Broker Dynamic Security administrator account used to provision and revoke device MQTT access. |
| `MQTT_DEVICE_HOST` | Optional broker host returned to devices during registration. It must be reachable from the device; it is not automatically made reachable by setting this value. |

Do not place real passwords, JWT secrets, or MQTT administrator credentials in documentation, source code, screenshots, or Git commits.

## 7. Database Setup

### Platform Database migrations

Run:

```bash
npm run db:migrate
```

The migration runner creates the configured Platform Database when required, creates/uses `migration_history`, applies pending Platform Database schema files in filename order, applies pending seed files, and records the applied files.

Current Platform Database schema files:

```text
database/platform/schema/
├── 001_create_platform_schema.sql
├── 002_create_device_database_routes.sql
└── 003_create_device_mqtt_credentials.sql
```

Current Platform Database seed files:

```text
database/platform/seed/
├── 001_seed_account_types.sql
├── 002_seed_permissions.sql
└── 003_seed_user_types.sql
```

### Customer Database migrations

A Customer Database is created when a customer registers. The current customer schema migration files are:

```text
database/customer/schema/
├── 001_create_customer_core_schema.sql
├── 002_create_customer_business_device_schema.sql
└── 003_add_device_code.sql
```

Each Customer Database has its own `migration_history` table.

**Migration rule:** do not edit a migration that has already been applied to a database. Create a new migration for future schema changes.

## 8. API Reference

Swagger UI is the source of truth for request schemas, validation rules, response bodies, and error responses:

```text
http://localhost:3000/api-docs
```

Related developer references:

- [Authentication and authorization](docs/AUTHENTICATION.md)
- [API flow and database reference](docs/API_FLOW_AND_DATABASE_REFERENCE.md)
- [MQTT provisioning and live telemetry](docs/MQTT_AND_LIVE_TELEMETRY.md)

| Method | Endpoint | Purpose | Authentication / Permission |
|---|---|---|---|
| `GET` | `/api/health` | Check API and Platform Database health | Public |
| `POST` | `/api/auth/register` | Register a customer and provision its Customer Database | Public |
| `POST` | `/api/auth/login` | Authenticate a customer user and return a JWT | Public |
| `GET` | `/api/auth/me` | Get the authenticated user and customer context | Bearer JWT |
| `POST` | `/api/products` | Create a product | Bearer JWT, `PRODUCT_MANAGE` |
| `GET` | `/api/products` | List active products | Bearer JWT, `DEVICE_MANAGE` (current route configuration) |
| `POST` | `/api/devices` | Register a device against an active product | Bearer JWT, `DEVICE_MANAGE` |
| `GET` | `/api/devices` | List registered devices | Bearer JWT, `DEVICE_DATA_VIEW` |
| `GET` | `/api/devices/{devicePublicId}` | Get device details | Bearer JWT, `DEVICE_DATA_VIEW` |
| `GET` | `/api/devices/{devicePublicId}/live` | Receive a live telemetry SSE stream | Bearer JWT, `DEVICE_DATA_VIEW` |

Protected REST APIs use:

```http
Authorization: Bearer <accessToken>
```

The JWT contains `userPublicId` and `customerPublicId`. Roles and permissions are resolved by the backend and are not embedded in the token.

## 9. End-to-End API Test Flow

Use Swagger UI or Postman. Run the requests in this order and use the identifiers returned by the previous request. The examples use generic documentation values; use fresh email addresses when testing registration.

### 1. Register a customer

`POST /api/auth/register`

```json
{
  "customerName": "Example Customer",
  "customerEmail": "customer@example.com",
  "mobile": "9000000000",
  "name": "Example User",
  "email": "user@example.com",
  "password": "Password@123"
}
```

Expected: `201 Created`.

### 2. Login

`POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

Expected: `200 OK`. Copy `accessToken` and authorize Swagger/Postman using Bearer Token.

### 3. Create and list products

`POST /api/products`

```json
{
  "name": "Temperature Monitoring Sensor",
  "modelNumber": "TMS-EXAMPLE-001",
  "description": "IoT temperature monitoring sensor"
}
```

Expected: `201 Created`. Then call `GET /api/products` and copy the returned `productPublicId`.

### 4. Register a device

`POST /api/devices`

```json
{
  "deviceName": "Example Temperature Sensor",
  "serialNumber": "SENSOR-EXAMPLE-001",
  "modelNumber": "TMS-EXAMPLE-001",
  "productPublicId": "<product-public-id-from-step-3>",
  "remarks": "API flow test device"
}
```

Expected: `201 Created`. The response contains `devicePublicId`, `deviceCode`, and an `mqtt` object with `host`, `port`, `clientId`, `username`, `password`, and `topic`. Save the password securely; do not put it in the repository or documentation.

### 5. Verify device and authenticated user

Use the returned `devicePublicId`:

```http
GET /api/devices?page=1&pageSize=20
GET /api/devices/{devicePublicId}
GET /api/auth/me
GET /api/health
```

Expected: successful responses for the registered device, authenticated user, and health check.

### 6. Test live telemetry

The live endpoint is a continuous SSE connection, not a normal one-response JSON API. Use Postman or `curl -N` to view events. Follow the instructions in [MQTT and Live Telemetry](docs/MQTT_AND_LIVE_TELEMETRY.md).

## 10. MQTT and Live Telemetry

Device MQTT access is provisioned when a device is registered. The backend creates a unique MQTT client and a role restricted to publishing to that device's telemetry topic. The Platform Database stores device routing and MQTT connection metadata; the broker's Dynamic Security plugin manages MQTT client authentication and ACLs.

The live processing pipeline validates the topic, device code, payload size, JSON payload, temperature value, customer route, and device existence before sending the reading to the in-memory live telemetry service.

The live endpoint is:

```http
GET /api/devices/{devicePublicId}/live
```

It streams `text/event-stream` events and requires `DEVICE_DATA_VIEW` permission. Swagger may continue loading while the stream is open; this is expected for SSE. Use Postman to view the live response body.

Detailed broker configuration, provisioning, message format, Postman, and command-line testing are documented in:

```text
docs/MQTT_AND_LIVE_TELEMETRY.md
```

## 11. Security and Data Handling

- Keep Platform Database and Customer Database isolation intact.
- Use the authenticated `customerPublicId` to resolve the Customer Database; do not accept a customer database name from the client.
- Keep JWT authentication and route permission checks enabled.
- Validate the device record and customer route before accepting telemetry.
- Do not expose database passwords, JWT secrets, MQTT administrator credentials, or device MQTT passwords.
- Do not put JWT access tokens in URLs.
- Keep device MQTT ACLs restricted to the device's own telemetry topic.
- Do not expose the Mosquitto Dynamic Security control interface to untrusted clients.
- For devices connecting over a network, ensure the broker listener, firewall, and advertised `MQTT_DEVICE_HOST` are configured for that network. Use TLS and appropriate network restrictions for production deployments.
- Live telemetry is memory-only in the current implementation. Do not add per-reading database persistence unless the requirement is explicitly changed.

## 12. Database Verification

The following queries are for local development verification. Replace placeholders with values from your own environment. Do not paste real credentials or sensitive records into shared documentation.

### Platform Database

```sql
USE GlobalIoTPlatformDB;
SHOW TABLES;
```

Find the Customer Database assigned to a customer:

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

Verify the device-to-customer route and MQTT connection metadata:

```sql
SELECT *
FROM device_database_routes
WHERE device_code = '<device-code>';

SELECT *
FROM device_mqtt_credentials
WHERE device_code = '<device-code>';
```

The MQTT metadata table contains connection metadata, not the device's generated MQTT password.

### Customer Database

Use the `database_name` returned by the Platform Database query:

```sql
USE <customer-database-name>;
SHOW TABLES;
```

Inspect recently created products and devices:

```sql
SELECT *
FROM products
ORDER BY id DESC
LIMIT 10;

SELECT *
FROM devices
ORDER BY id DESC
LIMIT 10;
```

Inspect role permissions and user-role assignments when troubleshooting authorization:

```sql
SELECT role_id, permission_code
FROM role_permissions
ORDER BY role_id, permission_code;

SELECT user_id, role_id, assigned_at, assigned_by_user_id
FROM user_roles
ORDER BY assigned_at DESC
LIMIT 20;
```

Live telemetry is not stored in the Customer Database in the current implementation. Do not expect MQTT readings to appear in a historical telemetry table.

---

## 13. Project Structure

The following tree reflects the existing project structure plus the device, MQTT provisioning, and live telemetry files added in the current implementation. It keeps the existing DTO, authentication, customer, product, and customer-database layers visible.

```text
GlobalIoTPlatform.Backend/
├── database/
│   ├── customer/
│   │   └── schema/
│   │       ├── 001_create_customer_core_schema.sql
│   │       └── 002_create_customer_business_device_schema.sql
│   │
│   └── platform/
│       ├── schema/
│       │   ├── 001_create_platform_schema.sql
│       │   ├── 002_create_device_database_routes.sql
│       │   └── 003_create_device_mqtt_credentials.sql
│       └── seed/
│           ├── 001_seed_account_types.sql
│           ├── 002_seed_permissions.sql
│           └── 003_seed_user_types.sql
│
├── docs/
│   ├── API_FLOW_AND_DATABASE_REFERENCE.md
│   ├── AUTHENTICATION.md
│   └── MQTT_AND_LIVE_TELEMETRY.md
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
│   │   ├── device.controller.js
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
│   │   ├── auth.middleware.js
│   │   └── authorization.middleware.js
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
│   │   │   ├── authorization.repository.js
│   │   │   ├── role-permission.repository.js
│   │   │   ├── role.repository.js
│   │   │   ├── user-role.repository.js
│   │   │   └── user.repository.js
│   │   ├── device/
│   │   │   └── device.repository.js
│   │   ├── platform/
│   │   │   ├── device-database-route.repository.js
│   │   │   ├── device-mqtt-credentials.repository.js
│   │   │   └── permission.repository.js
│   │   ├── product/
│   │   │   └── product.repository.js
│   │   └── health.repository.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── device.routes.js
│   │   ├── health.routes.js
│   │   └── product.routes.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── customer-db-connection.service.js
│   │   ├── customer-db-migration.service.js
│   │   ├── customer-db-provisioning.service.js
│   │   ├── device.service.js
│   │   ├── health.service.js
│   │   ├── live-telemetry.service.js
│   │   ├── mqtt-provisioning.service.js
│   │   ├── mqtt.service.js
│   │   └── product.service.js
│   │
│   └── utils/
│       └── jwt.util.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## 14. Current Project Status

The following flow has been manually verified in the local development environment:

- Customer registration and login.
- Product creation and product listing.
- Device registration with MQTT credential provisioning.
- Device listing and device detail retrieval.
- Current authenticated user (`GET /api/auth/me`).
- API and database health check (`GET /api/health`).
- MQTT device authentication and publishing to its assigned topic.
- Live telemetry delivery through the SSE endpoint, viewed with Git Bash and Postman.

This confirms the tested local flow; it does not by itself mean the broker is configured for external device access or production deployment.

## 15. Future Scope

Potential next modules include:

- Customer user management APIs.
- Customer role and role-assignment management APIs.
- Organization and location management APIs.
- Device ownership and access-management APIs.
- Device commands and control operations.
- Optional telemetry history, if explicitly required by the product design.
- Audit logging and operational monitoring.
- Email verification, password reset/change, and logout/session management.
