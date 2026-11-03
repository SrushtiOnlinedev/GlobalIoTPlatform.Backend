const express = require('express');

const deviceController = require('../controllers/device.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorization.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: List registered devices
 *     description: Returns paginated devices in the authenticated customer's database. Requires DEVICE_DATA_VIEW permission.
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
 *             example:
 *               message: Authentication required.
 *       403:
 *         description: User does not have the required permission.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Access denied.
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: User not found.
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: An unexpected error occurred.
 */
router.get(
    '/',
    authenticate,
    authorize('DEVICE_DATA_VIEW'),
    deviceController.getDevices
);


/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Register a device
 *     description: Registers a device against an active product in the authenticated customer's database. Requires DEVICE_MANAGE permission.
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
 *         description: Device registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceRegistrationResponse'
 *       400:
 *         description: Validation failed or organization/location mismatch.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/MessageResponse'
 *             examples:
 *               validationError:
 *                 value:
 *                   message: Validation failed
 *                   errors:
 *                     - field: productPublicId
 *                       message: Invalid UUID
 *               organizationLocationMismatch:
 *                 value:
 *                   message: Location does not belong to organization.
 *       401:
 *         description: Authentication required or token invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Authentication required.
 *       403:
 *         description: User does not have DEVICE_MANAGE permission.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Access denied.
 *       404:
 *         description: User, product, organization, or location not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             examples:
 *               userNotFound:
 *                 value:
 *                   message: User not found.
 *               productNotFound:
 *                 value:
 *                   message: Product not found.
 *               organizationNotFound:
 *                 value:
 *                   message: Organization not found.
 *               locationNotFound:
 *                 value:
 *                   message: Location not found.
 *       409:
 *         description: Device already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Device with the provided details already exists.
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: An unexpected error occurred.
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
 *     description: Returns device details, including connection status and last-seen timestamp.
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
 *             example:
 *               message: Authentication required.
 *       403:
 *         description: User does not have the required permission.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Access denied.
 *       404:
 *         description: Device or user not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             examples:
 *               deviceNotFound:
 *                 value:
 *                   message: Device not found.
 *               userNotFound:
 *                 value:
 *                   message: User not found.
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: An unexpected error occurred.
 */
router.get(
    '/:devicePublicId',
    authenticate,
    authorize('DEVICE_DATA_VIEW'),
    deviceController.getDeviceByPublicId
);



/**
 * @swagger
 * /api/devices/{devicePublicId}/live:
 *   get:
 *     summary: Stream live device telemetry
 *     description: Opens a Server-Sent Events (SSE) stream for live telemetry from a device belonging to the authenticated customer.
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
 *         description: Live telemetry event stream. The connection remains open while streaming.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             example: |
 *               event: telemetry
 *               data: {"temperature":25.5}
 *
 *       400:
 *         description: Invalid device public ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Validation failed
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: devicePublicId
 *                       message:
 *                         type: string
 *                         example: Invalid UUID
 *
 *       401:
 *         description: Authentication required or token invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Authentication required.
 *             examples:
 *               missingToken:
 *                 value:
 *                   message: Authentication required.
 *               invalidToken:
 *                 value:
 *                   message: Invalid or expired token.
 *
 *       403:
 *         description: User does not have permission to view device data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied.
 *
 *       404:
 *         description: User or device not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Device not found.
 *             examples:
 *               userNotFound:
 *                 value:
 *                   message: User not found.
 *               deviceNotFound:
 *                 value:
 *                   message: Device not found.
 *
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred.
 */
router.get(
    '/:devicePublicId/live',
    authenticate,
    authorize('DEVICE_DATA_VIEW'),
    deviceController.getLiveDeviceTelemetry
);


module.exports = router;