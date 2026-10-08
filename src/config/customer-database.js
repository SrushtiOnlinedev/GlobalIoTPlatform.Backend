const mysql = require('mysql2/promise');

const pools = new Map();

const IDLE_TIMEOUT = 30 * 60 * 1000;
const CONNECTION_LIMIT = 5;

const dbConfig = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
};

const getCustomerDatabasePool = ({
    databaseName,
    host,
    port
}) => {
    let entry = pools.get(databaseName);

    if (entry) {
        clearTimeout(entry.timer);

        entry.timer = setTimeout(async () => {
            const current = pools.get(databaseName);

            if (current !== entry) {
                return;
            }

            pools.delete(databaseName);

            try {
                await entry.pool.end();
            } catch (error) {
                console.error(
                    `Failed to close Customer DB pool: ${databaseName}`,
                    error
                );
            }
        }, IDLE_TIMEOUT);

        return entry.pool;
    }

    const pool = mysql.createPool({
        ...dbConfig,
        host,
        port: Number(port),
        database: databaseName,
        waitForConnections: true,
        connectionLimit: CONNECTION_LIMIT,
        queueLimit: 0
    });

    entry = {
        pool,
        timer: setTimeout(async () => {
            pools.delete(databaseName);

            try {
                await pool.end();
            } catch (error) {
                console.error(
                    `Failed to close Customer DB pool: ${databaseName}`,
                    error
                );
            }
        }, IDLE_TIMEOUT)
    };

    pools.set(databaseName, entry);

    return pool;
};

module.exports = {
    getCustomerDatabasePool
};