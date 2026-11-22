const crypto = require('crypto');
const db = require('../config/database');

const {
    getCustomerDatabaseConnection
} = require('./customer-db-connection.service');

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

const getAvailablePermissions = async () => {
    const connection = await db.getConnection();

    try {
        return await permissionRepository.getActivePermissions(connection);
    } finally {
        connection.release();
    }
};

const createRole = async (data, userPublicId, customerPublicId) => {
    const customerDb = await getCustomerDatabaseConnection(customerPublicId);

    const user = await userRepository.getUserByPublicId(
        customerDb,
        userPublicId
    );

    if (!user || user.status !== 1) {
        const error = new Error('User not found.');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const availablePermissions = await getAvailablePermissions();
    const validCodes = new Set(
        availablePermissions.map(permission => permission.code)
    );

    const invalidCodes = data.permissionCodes.filter(
        code => !validCodes.has(code)
    );

    if (invalidCodes.length > 0) {
        const error = new Error('Invalid permission codes.');
        error.code = 'INVALID_PERMISSION_CODES';
        error.invalidCodes = invalidCodes;
        throw error;
    }

    const connection = await customerDb.getConnection();

    try {
        await connection.beginTransaction();

        const existingRole = await roleRepository.getRoleByName(
            connection,
            data.name
        );

        if (existingRole) {
            const error = new Error('Role already exists.');
            error.code = 'ROLE_ALREADY_EXISTS';
            throw error;
        }

        const rolePublicId = crypto.randomUUID();

        const roleId = await roleRepository.createRole(
            connection,
            {
                publicId: rolePublicId,
                name: data.name,
                description: data.description ?? null,
                status: 1,
                createdByUserId: user.id
            }
        );

        await rolePermissionRepository.assignPermissions(
            connection,
            roleId,
            data.permissionCodes
        );

        await connection.commit();

        return { rolePublicId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getRoles = async (userPublicId, customerPublicId) => {
    const customerDb = await getCustomerDatabaseConnection(customerPublicId);

    const user = await userRepository.getUserByPublicId(
        customerDb,
        userPublicId
    );

    if (!user || user.status !== 1) {
        const error = new Error('User not found.');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const rows = await roleRepository.getRolesWithPermissions(customerDb);

    const rolesMap = new Map();

    for (const row of rows) {
        if (!rolesMap.has(row.id)) {
            rolesMap.set(row.id, {
                rolePublicId: row.public_id,
                name: row.name,
                description: row.description,
                status: row.status,
                permissionCodes: []
            });
        }

        if (row.permission_code) {
            rolesMap.get(row.id).permissionCodes.push(row.permission_code);
        }
    }

    return Array.from(rolesMap.values());
};

const updateRole = async (
    rolePublicId,
    data,
    userPublicId,
    customerPublicId
) => {
    const customerDb = await getCustomerDatabaseConnection(customerPublicId);

    const user = await userRepository.getUserByPublicId(
        customerDb,
        userPublicId
    );

    if (!user || user.status !== 1) {
        const error = new Error('User not found.');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const availablePermissions = await getAvailablePermissions();
    const validCodes = new Set(
        availablePermissions.map(permission => permission.code)
    );

    const invalidCodes = data.permissionCodes.filter(
        code => !validCodes.has(code)
    );

    if (invalidCodes.length > 0) {
        const error = new Error('Invalid permission codes.');
        error.code = 'INVALID_PERMISSION_CODES';
        error.invalidCodes = invalidCodes;
        throw error;
    }

    const connection = await customerDb.getConnection();

    try {
        await connection.beginTransaction();

        const role = await roleRepository.getRoleByPublicId(
            connection,
            rolePublicId
        );

        if (!role) {
            const error = new Error('Role not found.');
            error.code = 'ROLE_NOT_FOUND';
            throw error;
        }

        if (role.name === 'Customer Super Admin') {
            const error = new Error('System role cannot be modified.');
            error.code = 'ROLE_PROTECTED';
            throw error;
        }

        const existingRole = await roleRepository.getRoleByName(
            connection,
            data.name
        );

        if (existingRole && existingRole.id !== role.id) {
            const error = new Error('Role already exists.');
            error.code = 'ROLE_ALREADY_EXISTS';
            throw error;
        }

        await roleRepository.updateRole(connection, role.id, {
            name: data.name,
            description: data.description ?? null
        });

        await rolePermissionRepository.replacePermissions(
            connection,
            role.id,
            data.permissionCodes
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const updateRoleStatus = async (
    rolePublicId,
    status,
    userPublicId,
    customerPublicId
) => {
    const customerDb = await getCustomerDatabaseConnection(customerPublicId);

    const user = await userRepository.getUserByPublicId(
        customerDb,
        userPublicId
    );

    if (!user || user.status !== 1) {
        const error = new Error('User not found.');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const connection = await customerDb.getConnection();

    try {
        const role = await roleRepository.getRoleByPublicId(
            connection,
            rolePublicId
        );

        if (!role) {
            const error = new Error('Role not found.');
            error.code = 'ROLE_NOT_FOUND';
            throw error;
        }

        if (role.name === 'Customer Super Admin') {
            const error = new Error('System role cannot be modified.');
            error.code = 'ROLE_PROTECTED';
            throw error;
        }

        await roleRepository.updateRoleStatus(
            connection,
            role.id,
            status
        );
    } finally {
        connection.release();
    }
};

module.exports = {
    getAvailablePermissions,
    createRole,
    getRoles,
    updateRole,
    updateRoleStatus
};