const authService = require('../services/auth.service');
const registerDto = require('../dto/auth/register.dto');

const register = async (req, res) => {
    try {
        const data = registerDto.parse(req.body);

        const result = await authService.register(data);

        res.status(201).json({
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

        if (
            error.message === 'Requested account type not found.'
        ) {
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

module.exports = {
    register
};