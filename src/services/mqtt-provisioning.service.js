const crypto = require('crypto');
const mqtt = require('mqtt');

const CONTROL_TOPIC = '$CONTROL/dynamic-security/v1';
const RESPONSE_TOPIC = '$CONTROL/dynamic-security/v1/response';

const executeDynamicSecurityCommands = (client, commands) =>
    new Promise((resolve, reject) => {
        let timeout;

        const finish = (error, result) => {
            clearTimeout(timeout);
            client.removeListener('message', onMessage);
            client.removeListener('error', onError);

            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        };

        const onError = (error) => finish(error);

        const onMessage = (topic, payload) => {
            if (topic !== RESPONSE_TOPIC) {
                return;
            }

            let response;

            try {
                response = JSON.parse(payload.toString());
            } catch {
                finish(
                    new Error(
                        'Invalid Mosquitto Dynamic Security response.'
                    )
                );
                return;
            }

            const responses = response.responses;

            if (
                !Array.isArray(responses) ||
                responses.length !== commands.length
            ) {
                finish(
                    new Error(
                        'Unexpected Mosquitto Dynamic Security response.'
                    )
                );
                return;
            }

            const failedResponse = responses.find(
                (item) => item.error
            );

            if (failedResponse) {
                finish(
                    new Error(
                        `Mosquitto command failed: ${failedResponse.error}`
                    )
                );
                return;
            }

            finish(null, responses);
        };

        client.on('message', onMessage);
        client.once('error', onError);

        timeout = setTimeout(() => {
            finish(
                new Error(
                    'Timed out waiting for Mosquitto response.'
                )
            );
        }, 5000);

        client.publish(
            CONTROL_TOPIC,
            JSON.stringify({ commands }),
            { qos: 1 },
            (error) => {
                if (error) {
                    finish(error);
                }
            }
        );
    });

const provisionDeviceMqttAccess = async (deviceCode) => {
    const host = process.env.MQTT_HOST || '127.0.0.1';
    const port = Number(process.env.MQTT_PORT || 1884);

    const username = `device-${deviceCode.toLowerCase()}`;
    const password = crypto.randomBytes(24).toString('base64url');
    const mqttClientId = `client-${deviceCode}`;
    const roleName = `publisher-${deviceCode}`;
    const topic = `devices/${deviceCode}/telemetry`;

    if (
        !process.env.MQTT_ADMIN_USERNAME ||
        !process.env.MQTT_ADMIN_PASSWORD
    ) {
        throw new Error(
            'MQTT admin credentials are not configured.'
        );
    }

    const client = mqtt.connect(`mqtt://${host}:${port}`, {
        username: process.env.MQTT_ADMIN_USERNAME,
        password: process.env.MQTT_ADMIN_PASSWORD,
        clientId: `backend-provisioner-${crypto.randomUUID()}`,
        clean: true,
        reconnectPeriod: 0,
        connectTimeout: 10000
    });

    const waitForConnection = () =>
        new Promise((resolve, reject) => {
            let settled = false;

            const timer = setTimeout(() => {
                finish(
                    new Error('MQTT provisioning connection timed out.')
                );
            }, 10000);

            const finish = (error) => {
                if (settled) {
                    return;
                }

                settled = true;
                clearTimeout(timer);
                client.removeListener('connect', onConnect);
                client.removeListener('error', onError);

                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            };

            const onConnect = () => finish();
            const onError = (error) => finish(error);

            client.once('connect', onConnect);
            client.once('error', onError);
        });

    const subscribeToResponses = () =>
        new Promise((resolve, reject) => {
            client.subscribe(
                RESPONSE_TOPIC,
                { qos: 1 },
                (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            );
        });

    let roleCreationAttempted = false;
    let clientCreationAttempted = false;

    try {
        await waitForConnection();
        await subscribeToResponses();

        roleCreationAttempted = true;

        await executeDynamicSecurityCommands(client, [
            {
                command: 'createRole',
                rolename: roleName,
                acls: [
                    {
                        acltype: 'publishClientSend',
                        topic,
                        priority: 1,
                        allow: true
                    }
                ]
            }
        ]);

        clientCreationAttempted = true;

        await executeDynamicSecurityCommands(client, [
            {
                command: 'createClient',
                username,
                password,
                clientid: mqttClientId,
                roles: [
                    {
                        rolename: roleName,
                        priority: 1
                    }
                ]
            }
        ]);

        return {
            mqttUsername: username,
            mqttPassword: password,
            mqttClientId,
            mqttHost: process.env.MQTT_DEVICE_HOST || host,
            mqttPort: port,
            mqttTopic: topic
        };
    } catch (error) {
        if (clientCreationAttempted) {
            try {
                await executeDynamicSecurityCommands(client, [
                    {
                        command: 'deleteClient',
                        username
                    }
                ]);
            } catch (cleanupError) {
                console.error(
                    'MQTT client cleanup failed:',
                    cleanupError.message
                );
            }
        }

        if (roleCreationAttempted) {
            try {
                await executeDynamicSecurityCommands(client, [
                    {
                        command: 'deleteRole',
                        rolename: roleName
                    }
                ]);
            } catch (cleanupError) {
                console.error(
                    'MQTT role cleanup failed:',
                    cleanupError.message
                );
            }
        }

        throw error;
    } finally {
        client.end(true);
    }
};

const revokeDeviceMqttAccess = async (deviceCode) => {
    const username = `device-${deviceCode.toLowerCase()}`;
    const roleName = `publisher-${deviceCode}`;

    const host = process.env.MQTT_HOST || '127.0.0.1';
    const port = Number(process.env.MQTT_PORT || 1884);

    const adminUsername = process.env.MQTT_ADMIN_USERNAME;
    const adminPassword = process.env.MQTT_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
        throw new Error(
            'MQTT admin credentials are not configured.'
        );
    }

    const client = mqtt.connect(`mqtt://${host}:${port}`, {
        username: adminUsername,
        password: adminPassword,
        clientId: `revoke-${crypto.randomUUID()}`,
        clean: true,
        reconnectPeriod: 0,
        connectTimeout: 10000
    });

    const waitForConnection = () =>
        new Promise((resolve, reject) => {
            const finish = (error) => {
                clearTimeout(timer);
                client.removeListener('connect', onConnect);
                client.removeListener('error', onError);

                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            };

            const onConnect = () => finish();
            const onError = (error) => finish(error);

            const timer = setTimeout(() => {
                finish(
                    new Error('MQTT cleanup connection timed out.')
                );
            }, 10000);

            client.once('connect', onConnect);
            client.once('error', onError);
        });

    try {
        await waitForConnection();

        await new Promise((resolve, reject) => {
            client.subscribe(
                RESPONSE_TOPIC,
                { qos: 1 },
                (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            );
        });

        const errors = [];

        try {
            await executeDynamicSecurityCommands(client, [
                {
                    command: 'deleteClient',
                    username
                }
            ]);
        } catch (error) {
            errors.push(`Client cleanup failed: ${error.message}`);
        }

        try {
            await executeDynamicSecurityCommands(client, [
                {
                    command: 'deleteRole',
                    rolename: roleName
                }
            ]);
        } catch (error) {
            errors.push(`Role cleanup failed: ${error.message}`);
        }

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
    } finally {
        client.end(true);
    }
};

module.exports = { 
    provisionDeviceMqttAccess,
    revokeDeviceMqttAccess
};
