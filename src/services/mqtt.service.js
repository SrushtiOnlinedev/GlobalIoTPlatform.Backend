const mqtt = require('mqtt');
const { getCustomerDatabaseConnection } =
    require('./customer-db-connection.service');

const deviceDatabaseRouteRepository = require(
    '../repositories/platform/device-database-route.repository'
);

const { publishLiveTelemetry } = require("./live-telemetry.service");

let client;

function startMqttSubscriber() {
    if (client) return client;

    const host = process.env.MQTT_HOST || '127.0.0.1';
    const port = Number(process.env.MQTT_PORT || 1884);
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;
    const topic = process.env.MQTT_TOPIC || 'devices/+/telemetry';

    client = mqtt.connect(`mqtt://${host}:${port}`, {
        username,
        password,
        clientId: 'global-iot-backend-subscriber',
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 10000
    });

    client.on('connect', () => {
        console.log('MQTT connected to local broker.');

        client.subscribe(topic, { qos: 0 }, (error) => {
            if (error) {
                console.error('MQTT subscription failed:', error.message);
                return;
            }

            console.log(`MQTT subscribed to: ${topic}`);
        });
    });

    client.on('message', async (receivedTopic, payload) => {
        const match = receivedTopic.match(
            /^devices\/([^/]+)\/telemetry$/
        );

        if (!match) {
            console.error('Invalid MQTT topic:', receivedTopic);
            return;
        }

        const deviceCode = match[1];

        if (!/^DEV-[A-F0-9]{8}$/.test(deviceCode)) {
            console.error('Invalid device code in MQTT topic:', deviceCode);
            return;
        }

        if (payload.length > 64 * 1024) {
            console.error('MQTT payload too large:', receivedTopic);
            return;
        }

        let telemetry;

        try {
            telemetry = JSON.parse(payload.toString());
        } catch {
            console.error('Invalid MQTT JSON payload:', receivedTopic);
            return;
        }

        if (
            telemetry === null ||
            typeof telemetry !== 'object' ||
            Array.isArray(telemetry) ||
            typeof telemetry.temperature !== 'number' ||
            !Number.isFinite(telemetry.temperature)
        ) {
            console.error('Invalid telemetry payload:', receivedTopic);
            return;
        }

        try {
            const customerPublicId =
                await deviceDatabaseRouteRepository
                    .getCustomerPublicIdByDeviceCode(deviceCode);

            if (!customerPublicId) {
                console.error(
                    'No active customer database route found for device:',
                    deviceCode
                );
                return;
            }

            const pool =
                await getCustomerDatabaseConnection(customerPublicId);

            const [devices] = await pool.execute(
                `SELECT id
                 FROM devices
                 WHERE device_code = ?
                 LIMIT 1`,
                [deviceCode]
            );

            if (devices.length === 0) {
                console.error('Device not found:', deviceCode);
                return;
            }

            publishLiveTelemetry(customerPublicId, deviceCode, telemetry);

            console.log('Live telemetry received:', {
                deviceCode,
                topic: receivedTopic
            });
        } catch (error) {
            console.error('Live telemetry processing failed:', {
                deviceCode,
                code: error.code,
                message: error.message
            });
        }
    });

    client.on('error', (error) => {
        console.error('MQTT connection error:', error.message);
    });

    return client;
}

module.exports = { startMqttSubscriber };