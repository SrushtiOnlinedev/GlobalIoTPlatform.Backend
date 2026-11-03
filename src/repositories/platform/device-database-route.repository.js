const db = require('../../config/database');

const createDeviceRoute = async (
    deviceCode,
    customerPublicId
) => {
    const connection = await db.getConnection();

    try {
        const [result] = await connection.execute(
            `
            INSERT INTO device_database_routes
                (device_code, customer_id)
            SELECT ?, c.id
            FROM customers c
            INNER JOIN customer_databases cd
                ON cd.customer_id = c.id
            WHERE c.public_id = ?
              AND c.status = 1
              AND cd.status = 1
              AND cd.provisioning_status = 'ACTIVE'
            LIMIT 1
            `,
            [deviceCode, customerPublicId]
        );

        if (result.affectedRows !== 1) {
            const error = new Error(
                'Active customer database not found for device route.'
            );
            error.code = 'CUSTOMER_DATABASE_NOT_AVAILABLE';
            throw error;
        }
    } finally {
        connection.release();
    }
};

const deleteDeviceRoute = async (deviceCode) => {
    const connection = await db.getConnection();

    try {
        await connection.execute(
            `
            DELETE FROM device_database_routes
            WHERE device_code = ?
            `,
            [deviceCode]
        );
    } finally {
        connection.release();
    }
};

const getCustomerPublicIdByDeviceCode = async (deviceCode) => {
    const connection = await db.getConnection();

    try {
        const [rows] = await connection.execute(
            `
            SELECT c.public_id AS customer_public_id
            FROM device_database_routes r
            INNER JOIN customers c
                ON c.id = r.customer_id
            INNER JOIN customer_databases cd
                ON cd.customer_id = c.id
            WHERE r.device_code = ?
              AND r.status = 1
              AND c.status = 1
              AND cd.status = 1
              AND cd.provisioning_status = 'ACTIVE'
            LIMIT 1
            `,
            [deviceCode]
        );

        return rows[0]?.customer_public_id ?? null;
    } finally {
        connection.release();
    }
};

module.exports = { 
    createDeviceRoute,
    deleteDeviceRoute,
    getCustomerPublicIdByDeviceCode
};