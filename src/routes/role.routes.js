const express = require('express');

const roleController = require('../controllers/role.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorization.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Get available permissions
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available permissions retrieved successfully.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Unexpected server error.
 */
router.get(
    '/permissions',
    authenticate,
    authorize('ROLE_MANAGE'),
    roleController.getAvailablePermissions
);


/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a customer role
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Device Operator
 *               description:
 *                 type: string
 *                 example: Can monitor assigned devices.
 *               permissionCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - DEVICE_DATA_VIEW
 *     responses:
 *       201:
 *         description: Role created successfully.
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Access denied.
 *       409:
 *         description: Role already exists.
 *       500:
 *         description: Unexpected server error.
 */
router.post(
    '/',
    authenticate,
    authorize('ROLE_MANAGE'),
    roleController.createRole
);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: List customer roles
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Unexpected server error.
 */
router.get(
    '/',
    authenticate,
    authorize('ROLE_MANAGE'),
    roleController.getRoles
);


/**
 * @swagger
 * /api/roles/{rolePublicId}:
 *   put:
 *     summary: Update a customer role
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rolePublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissionCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Role updated successfully.
 *       400:
 *         description: Validation failed.
 *       403:
 *         description: Access denied or system role protected.
 *       404:
 *         description: Role or user not found.
 *       409:
 *         description: Role already exists.
 */
router.put(
    '/:rolePublicId',
    authenticate,
    authorize('ROLE_MANAGE'),
    roleController.updateRole
);


/**
 * @swagger
 * /api/roles/{rolePublicId}/status:
 *   patch:
 *     summary: Activate or deactivate a customer role
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rolePublicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 0
 *     responses:
 *       200:
 *         description: Role status updated successfully.
 *       400:
 *         description: Validation failed.
 *       403:
 *         description: Access denied or system role protected.
 *       404:
 *         description: Role or user not found.
 */
router.patch(
    '/:rolePublicId/status',
    authenticate,
    authorize('ROLE_MANAGE'),
    roleController.updateRoleStatus
);

module.exports = router;