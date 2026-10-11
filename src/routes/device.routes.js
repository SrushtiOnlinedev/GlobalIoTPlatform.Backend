const express = require('express');

const deviceController = require(
    '../controllers/device.controller'
);

const {
    authenticate
} = require('../middleware/auth.middleware');

const {
    authorize
} = require('../middleware/authorization.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: List registered devices
 *     description: Returns devices in the authenticated customer's database.
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of devices per page.
 *     responses:
 *       200:
 *         description: Devices retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceListResponse'
 *       400:
 *         description: Invalid pagination parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               message: Validation failed
 *               errors:
 *                 - field: pageSize
 *                   message: 'Too big: expected number to be <=100'
 *       401:
 *         description: Authentication required or token invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       403:
 *         description: Access denied.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.get(
    '/',
    authenticate,
    authorize('DEVICE_MANAGE'),
    deviceController.getDevices
);


/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Register a device
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeviceRequest'
 *     responses:
 *       201:
 *         description: Device registered successfully
 *       400:
 *         description: Validation or organization/location mismatch
 *       401:
 *         description: Authentication required or token invalid
 *       403:
 *         description: User does not have DEVICE_MANAGE permission
 *       404:
 *         description: Related user, product, organization, or location not found
 *       409:
 *         description: Device already exists
 *       500:
 *         description: Unexpected server error
 */
router.post(
    '/',
    authenticate,
    authorize('DEVICE_MANAGE'),
    deviceController.createDevice
);


/**
 * @swagger
 * /api/devices/{devicePublicId}:
 *   get:
 *     summary: Get device details
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: devicePublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Public ID of the registered device.
 *     responses:
 *       200:
 *         description: Device retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceDetailsResponse'
 *       400:
 *         description: Invalid device public ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               message: Validation failed
 *               errors:
 *                 - field: devicePublicId
 *                   message: Invalid UUID
 *       401:
 *         description: Authentication required or token invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       403:
 *         description: Access denied.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Device or user not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Device not found.
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.get(
    '/:devicePublicId',
    authenticate,
    authorize('DEVICE_MANAGE'),
    deviceController.getDeviceByPublicId
);

module.exports = router;