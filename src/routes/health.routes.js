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
 *         description: API is running
 */

router.get('/', healthController.getHealth);

module.exports = router;