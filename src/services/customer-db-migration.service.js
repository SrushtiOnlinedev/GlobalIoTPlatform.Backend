const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const customerSchemaPath = path.join(
    __dirname,
    '..',
    '..',
    'database',
    'customer',
    'schema'
);

const getSqlFiles = (folder) => {
    return fs
        .readdirSync(folder)
        .filter(file => file.endsWith('.sql'))
        .sort();
};

const createMigrationTable = async (connection) => {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS migration_history
        (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(20) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

            UNIQUE KEY uq_migration_history_type_file
                (type, file_name)
        )
    `);
};

const migrateCustomerDatabase = async ({
    host,
    port,
    user,
    password,
    database
}) => {
    const connection = await mysql.createConnection({
        host,
        port: Number(port),
        user,
        password,
        database,
        multipleStatements: true
    });

    try {
        await createMigrationTable(connection);

        const files = getSqlFiles(customerSchemaPath);

        for (const file of files) {
            const [rows] = await connection.execute(
                `
                SELECT id
                FROM migration_history
                WHERE type = 'schema'
                  AND file_name = ?
                LIMIT 1
                `,
                [file]
            );

            if (rows.length > 0) {
                continue;
            }

            const sql = fs.readFileSync(
                path.join(customerSchemaPath, file),
                'utf8'
            );

            await connection.query(sql);

            await connection.execute(
                `
                INSERT INTO migration_history
                (
                    type,
                    file_name
                )
                VALUES ('schema', ?)
                `,
                [file]
            );
        }
    } finally {
        await connection.end();
    }
};

module.exports = {
    migrateCustomerDatabase
};