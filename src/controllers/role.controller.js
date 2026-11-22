const createRoleDto = require('../dto/role/create-role.dto');
const roleService = require('../services/role.service');
const updateRoleDto = require('../dto/role/update-role.dto');
const updateRoleStatusDto = require('../dto/role/update-role-status.dto');

const getAvailablePermissions = async (req, res) => {
    try {
        const permissions = await roleService.getAvailablePermissions();

        return res.status(200).json({ permissions });
    } catch (error) {
        console.error('Get permissions error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const createRole = async (req, res) => {
    try {
        const data = createRoleDto.parse(req.body);

        const { userPublicId, customerPublicId } = req.auth;

        const result = await roleService.createRole(
            data,
            userPublicId,
            customerPublicId
        );

        return res.status(201).json({
            message: 'Role created successfully.',
            rolePublicId: result.rolePublicId
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        if (error.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (error.code === 'INVALID_PERMISSION_CODES') {
            return res.status(400).json({
                message: 'Invalid permission codes.',
                invalidCodes: error.invalidCodes
            });
        }

        if (error.code === 'ROLE_ALREADY_EXISTS') {
            return res.status(409).json({
                message: 'Role already exists.'
            });
        }

        console.error('Create role error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const getRoles = async (req, res) => {
    try {
        const { userPublicId, customerPublicId } = req.auth;

        const roles = await roleService.getRoles(
            userPublicId,
            customerPublicId
        );

        return res.status(200).json({ roles });
    } catch (error) {
        if (error.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        console.error('Get roles error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const updateRole = async (req, res) => {
    try {
        const data = updateRoleDto.parse(req.body);

        const { userPublicId, customerPublicId } = req.auth;

        await roleService.updateRole(
            req.params.rolePublicId,
            data,
            userPublicId,
            customerPublicId
        );

        return res.status(200).json({
            message: 'Role updated successfully.'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const responses = {
            USER_NOT_FOUND: [404, 'User not found.'],
            ROLE_NOT_FOUND: [404, 'Role not found.'],
            ROLE_PROTECTED: [403, 'System role cannot be modified.'],
            ROLE_ALREADY_EXISTS: [409, 'Role already exists.'],
            INVALID_PERMISSION_CODES: [400, 'Invalid permission codes.']
        };

        if (responses[error.code]) {
            const [status, message] = responses[error.code];

            return res.status(status).json({
                message,
                ...(error.invalidCodes && {
                    invalidCodes: error.invalidCodes
                })
            });
        }

        console.error('Update role error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const updateRoleStatus = async (req, res) => {
    try {
        const { status } = updateRoleStatusDto.parse(req.body);
        const { userPublicId, customerPublicId } = req.auth;

        await roleService.updateRoleStatus(
            req.params.rolePublicId,
            status,
            userPublicId,
            customerPublicId
        );

        return res.status(200).json({
            message: 'Role status updated successfully.'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const responses = {
            USER_NOT_FOUND: [404, 'User not found.'],
            ROLE_NOT_FOUND: [404, 'Role not found.'],
            ROLE_PROTECTED: [403, 'System role cannot be modified.']
        };

        if (responses[error.code]) {
            const [statusCode, message] = responses[error.code];
            return res.status(statusCode).json({ message });
        }

        console.error('Update role status error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

module.exports = {
    getAvailablePermissions,
    createRole,
    getRoles,
    updateRole,
    updateRoleStatus
};