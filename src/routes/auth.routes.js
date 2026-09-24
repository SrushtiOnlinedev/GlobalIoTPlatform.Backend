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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Validation failed or invalid requested account type
 *       409:
 *         description: Registration cannot be completed with the provided details
 *       500:
 *         description: Unexpected server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a customer user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Unexpected server error
 */

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;