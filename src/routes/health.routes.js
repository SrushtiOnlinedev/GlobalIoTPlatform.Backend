const express = require('express');
const healthController = require('../controllers/health.controller');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API and database health
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API and database health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         description: Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthErrorResponse'
 *             example:
 *               status: ERROR
 *               message: Database connection failed
 */

router.get('/', healthController.getHealth);

module.exports = router;