const express = require('express');

const productController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorization.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateProductResponse'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               message: Validation failed
 *               errors:
 *                 - field: name
 *                   message: 'Too small: expected string to have >=2 characters'
 *       403:
 *         description: User does not have the required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Access denied.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: User not found.
 *       500:
 *         description: Unexpected server error
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
    authorize('PRODUCT_MANAGE'),
    productController.createProduct
);

module.exports = router;