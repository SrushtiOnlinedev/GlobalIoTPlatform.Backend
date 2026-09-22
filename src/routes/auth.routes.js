const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new customer
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *       400:
 *         description: Validation failed or invalid requested account type
 *       409:
 *         description: Registration cannot be completed with the provided details
 *       500:
 *         description: Unexpected server error
 */

router.post('/register', authController.register);

module.exports = router;