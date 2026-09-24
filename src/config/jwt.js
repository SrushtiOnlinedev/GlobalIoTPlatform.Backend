require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';

if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
}

module.exports = {
    jwtSecret,
    jwtExpiresIn
};