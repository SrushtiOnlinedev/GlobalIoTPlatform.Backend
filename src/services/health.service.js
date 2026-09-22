const healthRepository = require('../repositories/health.repository');

const getHealthStatus = async () => {
    const database = await healthRepository.checkDatabase();

    return {
        status: 'OK',
        message: 'Global IoT Platform API is running',
        database: database.result === 1 ? 'Connected' : 'Not Connected'
    };
};

module.exports = {
    getHealthStatus
};