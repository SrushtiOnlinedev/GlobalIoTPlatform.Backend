const crypto = require('crypto');
const mysql = require('mysql2/promise');

const db = require('../config/database');

const customerDatabaseRepository = require(
    '../repositories/customer-database/customer-database.repository'
);

const permissionRepository = require(
    '../repositories/platform/permission.repository'
);

const userRepository = require(
    '../repositories/customer-db/user.repository'
);

const roleRepository = require(
    '../repositories/customer-db/role.repository'
);

const rolePermissionRepository = require(
    '../repositories/customer-db/role-permission.repository'
);

const userRoleRepository = require(
    '../repositories/customer-db/user-role.repository'
);

const {
    migrateCustomerDatabase
} = require('./customer-db-migration.service');

const CUSTOMER_DB_PREFIX = 'giot_c_';
const CUSTOMER_DB_ID_LENGTH = 12;
const MAX_NAME_ATTEMPTS = 5;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
};

const generateShortId = () => {
    return crypto
        .randomBytes(6)
        .toString('hex')
        .slice(0, CUSTOMER_DB_ID_LENGTH);
};

const quoteIdentifier = (value) => {
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        throw new Error(`Invalid database name: ${value}`);
    }

    return `\`${value}\``;
};

const generateCustomerDatabaseName = async () => {
    const connection = await mysql.createConnection(dbConfig);

    try {
        for (
            let attempt = 0;
            attempt < MAX_NAME_ATTEMPTS;
            attempt++
        ) {
            const databaseName =
                `${CUSTOMER_DB_PREFIX}${generateShortId()}`;

            const [rows] = await connection.execute(
                `
                SELECT SCHEMA_NAME
                FROM INFORMATION_SCHEMA.SCHEMATA
                WHERE SCHEMA_NAME = ?
                LIMIT 1
                `,
                [databaseName]
            );

            if (rows.length === 0) {
                return databaseName;
            }
        }

        throw new Error(
            'Unable to generate a unique Customer DB name.'
        );
    } finally {
        await connection.end();
    }
};

const createCustomerDatabase = async (databaseName) => {
    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.query(
            `
            CREATE DATABASE IF NOT EXISTS
            ${quoteIdentifier(databaseName)}
            `
        );
    } finally {
        await connection.end();
    }
};

const initializeCustomerDatabase = async (
    databaseName,
    owner
) => {
    const platformConnection = await db.getConnection();

    let permissionCodes;

    try {
        permissionCodes =
            await permissionRepository.getActivePermissionCodes(
                platformConnection
            );
    } finally {
        platformConnection.release();
    }

    const connection = await mysql.createConnection({
        ...dbConfig,
        database: databaseName,
        multipleStatements: true
    });

    try {
        await connection.beginTransaction();

        let user = await userRepository.getUserByPublicId(
            connection,
            owner.publicId
        );

        if (!user) {
            const userId = await userRepository.createUser(
                connection,
                {
                    publicId: owner.publicId,
                    parentUserId: null,
                    name: owner.name,
                    email: owner.email,
                    mobile: owner.mobile,
                    userTypeCode: 'CUSTOMER_OWNER',
                    status: 1
                }
            );

            user = {
                id: userId,
                public_id: owner.publicId
            };
        }

        let role = await roleRepository.getRoleByName(
            connection,
            'Customer Super Admin'
        );

        if (!role) {
            const roleId = await roleRepository.createRole(
                connection,
                {
                    publicId: crypto.randomUUID(),
                    name: 'Customer Super Admin',
                    description:
                        'Initial administrative role for the customer.',
                    status: 1,
                    createdByUserId: user.id
                }
            );

            role = {
                id: roleId
            };
        }

        await rolePermissionRepository.assignPermissions(
            connection,
            role.id,
            permissionCodes
        );

        await userRoleRepository.assignRole(
            connection,
            user.id,
            role.id,
            null
        );

        await connection.commit();

        return {
            userId: user.id,
            userPublicId: user.public_id,
            roleId: role.id
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        await connection.end();
    }
};

const provisionCustomerDatabase = async ({
    customerId,
    owner
}) => {
    const databaseName =
        await generateCustomerDatabaseName();

    const platformConnection = await db.getConnection();

    let databaseId;

    try {
        databaseId =
            await customerDatabaseRepository.createProvisioningRecord(
                platformConnection,
                {
                    publicId: crypto.randomUUID(),
                    customerId,
                    databaseName,
                    host: dbConfig.host,
                    port: dbConfig.port
                }
            );
    } finally {
        platformConnection.release();
    }

    try {
        await createCustomerDatabase(databaseName);

        await migrateCustomerDatabase({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            database: databaseName
        });

        const customerUser =
            await initializeCustomerDatabase(
                databaseName,
                owner
            );

        return {
            databaseId,
            databaseName,
            ...customerUser
        };
    } catch (error) {
        const connection = await db.getConnection();

        try {
            await customerDatabaseRepository.markProvisioningFailed(
                connection,
                databaseId,
                error.message
            );
        } finally {
            connection.release();
        }

        throw error;
    }
};

module.exports = {
    generateCustomerDatabaseName,
    createCustomerDatabase,
    provisionCustomerDatabase
};