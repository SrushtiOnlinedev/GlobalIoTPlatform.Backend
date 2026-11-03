const latestTelemetryByDevice = new Map();
const telemetryClientsByDevice = new Map();

const createDeviceKey = (customerPublicId, deviceCode) =>
    `${customerPublicId}:${deviceCode}`;

const sendEvent = (response, eventName, data) => {
    if (response.writableEnded || response.destroyed) {
        return false;
    }

    return response.write(
        `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
    );
};

const publishLiveTelemetry = (
    customerPublicId,
    deviceCode,
    payload
) => {
    const key = createDeviceKey(customerPublicId, deviceCode);

    const reading = {
        deviceCode,
        payload,
        receivedAt: new Date().toISOString()
    };

    latestTelemetryByDevice.set(key, reading);

    const clients = telemetryClientsByDevice.get(key);

    if (clients) {
        for (const response of clients) {
            if (response.writableEnded || response.destroyed) {
                clients.delete(response);
                continue;
            }

            sendEvent(response, 'telemetry', reading);
        }

        if (clients.size === 0) {
            telemetryClientsByDevice.delete(key);
        }
    }

    return reading;
};

const getLatestTelemetry = (customerPublicId, deviceCode) => {
    const key = createDeviceKey(customerPublicId, deviceCode);

    return latestTelemetryByDevice.get(key) ?? null;
};

const getDeviceConnectionState = (
    customerPublicId,
    deviceCode,
    timeoutSeconds
) => {
    const latest = getLatestTelemetry(customerPublicId, deviceCode);

    if (!latest) {
        return {
            connectionStatus: 'Registered',
            lastSeenAt: null,
            latestTelemetry: null
        };
    }

    const elapsedMilliseconds =
        Date.now() - Date.parse(latest.receivedAt);

    return {
        connectionStatus:
            elapsedMilliseconds <= timeoutSeconds * 1000
                ? 'Connected'
                : 'Disconnected',
        lastSeenAt: latest.receivedAt,
        latestTelemetry: latest.payload
    };
};

const subscribeToDeviceTelemetry = (
    customerPublicId,
    deviceCode,
    response
) => {
    const key = createDeviceKey(customerPublicId, deviceCode);

    let clients = telemetryClientsByDevice.get(key);

    if (!clients) {
        clients = new Set();
        telemetryClientsByDevice.set(key, clients);
    }

    clients.add(response);

    const cleanup = () => {
        clients.delete(response);

        if (clients.size === 0) {
            telemetryClientsByDevice.delete(key);
        }
    };

    response.on('close', cleanup);

    const latest = getLatestTelemetry(customerPublicId, deviceCode);

    if (latest) {
        sendEvent(response, 'telemetry', latest);
    }

    return cleanup;
};

module.exports = {
    publishLiveTelemetry,
    getLatestTelemetry,
    getDeviceConnectionState,
    subscribeToDeviceTelemetry
};