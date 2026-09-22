const db = require('../config/database');

const checkDatabase = async () => {
    const [rows] = await db.query('SELECT 1 AS result');

    return rows[0];
};

module.exports = {
    checkDatabase
};