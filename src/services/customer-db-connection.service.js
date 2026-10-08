const db = require('../config/database');

const {
    getCustomerDatabasePool
} = require('../config/customer-database');

const getCustomerDatabaseConnection = async (
    customerPublicId
) => {
    const connection = await db.getConnection();

    try {
        const [rows] = await connection.execute(
            `
            SELECT
                cd.database_name,
                cd.database_host,
                cd.database_port
            FROM customers c

            INNER JOIN customer_databases cd
                ON cd.customer_id = c.id

            WHERE c.public_id = ?
              AND c.status = 1
              AND cd.status = 1
              AND cd.provisioning_status = 'ACTIVE'

            LIMIT 1
            `,
            [customerPublicId]
        );

        const database = rows[0];

        if (!database) {
            const error = new Error('Customer database not available.');
            error.code = 'CUSTOMER_DATABASE_NOT_AVAILABLE';
            throw error;
        }

        return getCustomerDatabasePool({
            databaseName: database.database_name,
            host: database.database_host,
            port: database.database_port
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    getCustomerDatabaseConnection
};