# MQTT and Live Telemetry

This document describes device MQTT provisioning, telemetry validation, live delivery through Server-Sent Events (SSE), and local testing for `GlobalIoTPlatform.Backend`.

## 1. Overview

The current telemetry implementation receives MQTT messages, validates the device and customer route, and forwards readings to connected SSE clients.

**Live telemetry is memory-only.** The backend does not insert every MQTT reading into a telemetry history table. The in-memory latest reading and connection state are cleared when the backend process restarts.

## 2. End-to-End Data Flow

```text
Device
  |
  | MQTT publish
  | devices/{deviceCode}/telemetry
  v
Mosquitto Broker
  |
  v
Backend MQTT Subscriber
  |
  ├── Validate topic and device code
  ├── Validate payload size and JSON
  ├── Validate temperature is a finite number
  └── Resolve deviceCode in Platform DB
          |
          v
      device_database_routes
          |
          v
      Resolve Customer DB
          |
          v
      Confirm device exists in Customer DB
          |
          v
      Live Telemetry Service (in-memory)
          |
          v
      GET /api/devices/{devicePublicId}/live
          |
          v
      SSE client receives telemetry event
```

The platform route is important: a `deviceCode` identifies the owning customer database. The backend must resolve this route and confirm the device exists before publishing the reading to the live service.

## 3. Broker and Environment Configuration

The local development setup uses Mosquitto with the Dynamic Security plugin. Mosquitto 2.1.2 was used in the recent local test environment.

The relevant `.env` keys are:

| Variable | Purpose |
|---|---|
| `MQTT_HOST` | Broker host used by the backend subscriber and provisioning/revocation clients. |
| `MQTT_PORT` | Broker port; local development uses `1884`. |
| `MQTT_USERNAME` | Backend subscriber account. |
| `MQTT_PASSWORD` | Password for the backend subscriber account. |
| `MQTT_TOPIC` | Backend subscription filter; current default is `devices/+/telemetry`. |
| `MQTT_ADMIN_USERNAME` | Dynamic Security administrator account used by backend provisioning. |
| `MQTT_ADMIN_PASSWORD` | Dynamic Security administrator password. |
| `MQTT_DEVICE_HOST` | Optional broker host returned in device registration response. It must be reachable from the actual device. |
| `DEVICE_CONNECTION_TIMEOUT_SECONDS` | Threshold used for device connection status; current default is `120`. |

Keep credentials in the local `.env` file only. Never put actual values in Git, documentation, screenshots, support messages, or logs.

### Listener address must match the advertised host

`MQTT_HOST` is used by the backend to connect to the broker. `MQTT_DEVICE_HOST`, when configured, is the host returned to the device during registration.

The broker must actually listen on the address and port advertised to the device, and the network/firewall must allow that connection. For example, when Mosquitto is configured with:

```conf
listener 1884 127.0.0.1
```

only clients running on the same machine can connect through `127.0.0.1`. A different device cannot connect to that loopback listener through the machine's LAN IP. For a device on another machine, configure an appropriate reachable listener and firewall rule deliberately; use TLS and network restrictions for production.

## 4. Device MQTT Provisioning

Device MQTT access is provisioned during:

```http
POST /api/devices
```

The request requires an authenticated user with `DEVICE_MANAGE` permission and an active product in that customer's Customer DB.

After the device is created, the backend:

1. Creates a platform-level device-to-customer route in `device_database_routes`.
2. Generates a device MQTT username and password.
3. Generates a client ID and device-specific publisher role.
4. Uses the Mosquitto Dynamic Security control topic to create the role and client.
5. Restricts the role to publishing to that device's own telemetry topic.
6. Stores MQTT connection metadata in `device_mqtt_credentials`.
7. Returns the MQTT connection details in the device registration response.

The device code format is:

```text
DEV-XXXXXXXX
```

The provisioned values follow this pattern:

| Field | Pattern |
|---|---|
| Username | `device-{lowercase-deviceCode}` |
| Client ID | `client-{deviceCode}` |
| Publisher role | `publisher-{deviceCode}` |
| Topic | `devices/{deviceCode}/telemetry` |

The `mqtt` object in the `201 Created` response contains:

```json
{
  "host": "<broker-host-reachable-by-device>",
  "port": 1884,
  "clientId": "client-DEV-XXXXXXXX",
  "username": "device-dev-xxxxxxxx",
  "password": "<generated-device-password>",
  "topic": "devices/DEV-XXXXXXXX/telemetry"
}
```

The password is generated during provisioning and returned in the registration response. Save it securely. Do not commit it or share it. The `device_mqtt_credentials` table stores connection metadata; the broker's Dynamic Security plugin manages the MQTT client authentication and ACL configuration.

If provisioning fails, the backend attempts to remove the MQTT client and publisher role and clean up the related device registration resources. Cleanup failures are logged for investigation; do not expose credentials in those logs.

## 5. MQTT Topic and Payload

### Topic

Each device publishes only to its own topic:

```text
devices/{deviceCode}/telemetry
```

Example format:

```text
devices/DEV-XXXXXXXX/telemetry
```

The backend subscriber uses the `devices/+/telemetry` filter and validates that the full topic contains a valid device code.

### Payload validation

The current subscriber checks:

- The topic matches the expected device telemetry structure.
- The device code matches `DEV-[A-F0-9]{8}`.
- The MQTT message is no larger than 64 KB.
- The message is valid JSON and is a JSON object, not an array or `null`.
- `temperature` exists and is a finite JSON number.

Other numeric or descriptive fields may be included in the payload and are forwarded with the reading. For example:

```json
{
  "temperature": 26.5,
  "humidity": 58
}
```

`humidity` is an example additional field; the current subscriber's required numeric validation is for `temperature`.

## 6. Live Telemetry API (SSE)

### Endpoint

```http
GET /api/devices/{devicePublicId}/live
```

Requirements:

- Valid Bearer JWT.
- The authenticated user must have `DEVICE_DATA_VIEW` permission.
- The device must exist in the authenticated customer's Customer DB.

The client supplies the device public ID, not a device code. The backend retrieves the device record and uses its validated `deviceCode` to subscribe to the correct customer/device stream.

### Event format

The endpoint responds with `Content-Type: text/event-stream` and keeps the HTTP connection open. Each reading is sent as an SSE event:

```text
event: telemetry
data: {"deviceCode":"DEV-XXXXXXXX","payload":{"temperature":26.5,"humidity":58},"receivedAt":"<iso-8601-timestamp>"}

```

This is a stream, not a normal JSON response. The request remaining open is expected.

### Test with Postman

1. Create a `GET` request to `http://localhost:3000/api/devices/{devicePublicId}/live`.
2. In **Authorization**, choose **Bearer Token** and provide the JWT returned by login.
3. In **Headers**, set `Accept` to `text/event-stream` and `Cache-Control` to `no-cache`.
4. Click **Send**. Keep the request open.
5. Publish a new MQTT message from a second terminal using that device's provisioned credentials.
6. Confirm the `telemetry` event appears in Postman's response stream.

Swagger UI's Execute button may continue loading because the SSE response intentionally remains open. This does not mean the endpoint is broken. Use Postman or `curl -N` to inspect the stream.

### Test with curl

```bash
curl -N \
  -H "Authorization: Bearer <access-token>" \
  -H "Accept: text/event-stream" \
  "http://localhost:3000/api/devices/<device-public-id>/live"
```

Keep the command running while publishing telemetry from another terminal.

## 7. Publish a Test Message

Use the actual host, port, client ID, username, password, and topic returned by device registration. The following is a generic Git Bash example:

```bash
"/c/Program Files/mosquitto/mosquitto_pub.exe" \
  -h 127.0.0.1 -p 1884 \
  -i "client-DEV-XXXXXXXX" \
  -u "device-dev-xxxxxxxx" \
  -P "<device-mqtt-password>" \
  -t "devices/DEV-XXXXXXXX/telemetry" \
  -m '{"temperature":26.5,"humidity":58}'
```

Use the exact `clientId` returned by registration with the `-i` option. The client ID, username, and topic must match the provisioned client and its ACL. Replace the sample host, IDs, username, password, and topic with the actual response values in your local terminal only.

If Git Bash reports `mosquitto_pub: command not found`, use the executable's full path as shown above, adjusting it if Mosquitto is installed in a different directory.

A successful publish normally prints no message. Check the still-open Postman or `curl -N` stream for the new event.

## 8. Device Connection Status

The device list and detail APIs include `lastSeenAt` and `connectionStatus`.

| Status | Meaning |
|---|---|
| `Registered` | No telemetry has been received by the current backend process for the device yet. |
| `Connected` | The latest reading is within `DEVICE_CONNECTION_TIMEOUT_SECONDS`. |
| `Disconnected` | The latest reading is older than the configured timeout. |

The live service stores the latest reading and its timestamp in memory. The state is not recovered from a telemetry history table after a backend restart.

## 9. Data Persistence

The current implementation is for live delivery only:

- The MQTT subscriber calls the in-memory live telemetry service.
- Connected SSE clients receive the reading immediately.
- The latest reading is kept in memory for the current process lifetime.
- MQTT readings are not inserted into a `device_telemetry` history table.
- A backend restart clears the in-memory latest reading and connection state.

Do not reintroduce per-reading database writes unless telemetry history becomes an explicit requirement.

## 10. Troubleshooting

| Symptom | Check |
|---|---|
| `mosquitto_pub: command not found` | Use the full path to `mosquitto_pub.exe` or add the Mosquitto install directory to PATH. |
| `Connection refused` | Confirm the broker process is running, the port is correct, and the broker listener is bound to the host address being used. A listener bound to `127.0.0.1` accepts only same-machine connections. |
| `Connection Refused: not authorised` | Verify the MQTT username and password, use the exact registered client ID with `-i`, and confirm that the client role allows publishing to the exact device topic. |
| Publish succeeds but no SSE event appears | Confirm the backend subscriber is connected/subscribed, the topic uses the registered device code, the payload is valid JSON with a numeric `temperature`, the platform route exists, and the device exists in the routed Customer DB. |
| Swagger keeps loading | Expected for a continuous SSE response. Use Postman or `curl -N` to view events. |
| Device remains `Registered` | Publish a valid reading and check that the backend accepts it. The state is in memory and begins only after a reading is received by the current process. |

Do not change Mosquitto listeners, plugin configuration, roles, or ACLs until the active broker configuration and the exact failure have been identified.

## 11. Security Notes

- Give each device its own MQTT client identity and publisher role.
- Restrict each device to its own telemetry publish topic.
- Do not give device clients permission to subscribe to telemetry topics unless a separately reviewed requirement needs it.
- Keep Dynamic Security administrator credentials private and separate from device credentials.
- Do not expose the Dynamic Security control topic or its administration account to devices.
- Do not log device MQTT passwords or JWT tokens.
- Use a broker address reachable by the device, TLS, firewall restrictions, and credential rotation procedures for non-local deployments.
