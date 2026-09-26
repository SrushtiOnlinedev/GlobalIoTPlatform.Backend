const authService = require('../services/auth.service');
const registerDto = require('../dto/auth/register.dto');
const loginDto = require('../dto/auth/login.dto');

const register = async (req, res) => {
    try {
        const data = registerDto.parse(req.body);

        await authService.register(data);

        return res.status(201).json({
            message: 'Customer registered successfully.'
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

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Registration cannot be completed with the provided details.'
            });
        }

        if (error.message === 'Requested account type not found.') {
            return res.status(400).json({
                message: 'Invalid requested account type.'
            });
        }

        console.error(error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const login = async (req, res) => {
    try {
        const data = loginDto.parse(req.body);

        const result = await authService.login(data);

        return res.status(200).json({
            message: 'Login successful.',
            accessToken: result.accessToken,
            tokenType: result.tokenType,
            expiresIn: result.expiresIn
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

        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({
                message: 'Invalid credentials.'
            });
        }

        console.error(error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const { userPublicId, customerPublicId } = req.auth;

        const user = await authService.getCurrentUser(
            userPublicId,
            customerPublicId
        );

        return res.status(200).json({
            message: 'Current user retrieved successfully.',
            user
        });
    } catch (error) {
        if (error.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        console.error('Get current user error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};