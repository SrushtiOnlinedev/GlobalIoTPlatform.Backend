const healthService = require('../services/health.service');

const getHealth = async (req, res) => {
    try {
        const result = await healthService.getHealthStatus();

        res.json(result);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed'
        });
    }
};

module.exports = {
    getHealth
};