require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'GlobalIoTPlatformDB';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
};

const schemaPath = path.join(__dirname, '..', 'database', 'schema');
const seedPath = path.join(__dirname, '..', 'database', 'seed');

const quoteIdentifier = (value) => {
    if (!/^[a-zA-Z0-9_$]+$/.test(value)) {
        throw new Error(`Invalid database name: ${value}`);
    }

    return `\`${value}\``;
};

const getSqlFiles = (folder) => {
    return fs
        .readdirSync(folder)
        .filter(file => file.endsWith('.sql'))
        .sort();
};

const ensureDatabase = async () => {
    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(DB_NAME)}`
        );
    } finally {
        await connection.end();
    }
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

const runFolder = async (connection, folder, type) => {
    const files = getSqlFiles(folder);

    for (const file of files) {
        const [rows] = await connection.execute(
            `
            SELECT id
            FROM migration_history
            WHERE type = ?
              AND file_name = ?
            LIMIT 1
            `,
            [type, file]
        );

        if (rows.length > 0) {
            console.log(`Skipped ${type}: ${file}`);
            continue;
        }

        console.log(`Running ${type}: ${file}`);

        const sql = fs.readFileSync(
            path.join(folder, file),
            'utf8'
        );

        try {
            await connection.query(sql);

            await connection.execute(
                `
                INSERT INTO migration_history
                (
                    type,
                    file_name
                )
                VALUES (?, ?)
                `,
                [type, file]
            );

            console.log(`Completed ${type}: ${file}`);
        } catch (error) {
            console.error(`Failed ${type}: ${file}`);
            throw error;
        }
    }
};

const migrate = async () => {
    console.log(`Database: ${DB_NAME}`);

    await ensureDatabase();

    const connection = await mysql.createConnection({
        ...dbConfig,
        database: DB_NAME,
        multipleStatements: true
    });

    try {
        await createMigrationTable(connection);

        await runFolder(
            connection,
            schemaPath,
            'schema'
        );

        await runFolder(
            connection,
            seedPath,
            'seed'
        );

        console.log('Database migration completed successfully.');
    } finally {
        await connection.end();
    }
};

migrate().catch(error => {
    console.error(error);
    process.exit(1);
});