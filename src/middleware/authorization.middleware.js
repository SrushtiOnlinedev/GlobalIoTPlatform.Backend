const {
    getCustomerDatabaseConnection
} = require('../services/customer-db-connection.service');

const authorizationRepository = require(
    '../repositories/customer-db/authorization.repository'
);

const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const { userPublicId, customerPublicId } = req.auth;

            const customerDb =
                await getCustomerDatabaseConnection(
                    customerPublicId
                );

            const permissions =
                await authorizationRepository.getUserPermissions(
                    customerDb,
                    userPublicId
                );

            if (!permissions.includes(requiredPermission)) {
                return res.status(403).json({
                    message: 'Access denied.'
                });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);

            return res.status(500).json({
                message: 'An unexpected error occurred.'
            });
        }
    };
};

module.exports = {
    authorize
};