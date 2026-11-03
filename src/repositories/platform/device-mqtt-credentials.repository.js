
const db = require('../../config/database');

const createDeviceMqttCredentials = async (mqtt) => {

    const connection = await db.getConnection();

    try {
        await connection.execute(
            `
            INSERT INTO device_mqtt_credentials
            (
                device_code,
                mqtt_host,
                mqtt_port,
                mqtt_client_id,
                mqtt_username,
                mqtt_topic,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
            `,
            [
                mqtt.deviceCode,
                mqtt.host,
                mqtt.port,
                mqtt.clientId,
                mqtt.username,
                mqtt.topic
            ]
        );
    } finally {
        connection.release();
    }
};

const deleteDeviceMqttCredentials = async (deviceCode) => {
    const connection = await db.getConnection();

    try {
        await connection.execute(
            `DELETE FROM device_mqtt_credentials
             WHERE device_code = ?`,
            [deviceCode]
        );
    } finally {
        connection.release();
    }
};

module.exports = {
    createDeviceMqttCredentials,
    deleteDeviceMqttCredentials
};
