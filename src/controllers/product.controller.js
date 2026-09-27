const createProductDto = require('../dto/product/create-product.dto');
const productService = require('../services/product.service');

const createProduct = async (req, res) => {
    try {
        const data = createProductDto.parse(req.body);

        const { userPublicId, customerPublicId } = req.auth;

        const result = await productService.createProduct(
            data,
            userPublicId,
            customerPublicId
        );

        return res.status(201).json({
            message: 'Product created successfully.'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        if (error.code === 'CUSTOMER_NOT_FOUND') {
            return res.status(404).json({
                message: 'Customer not found.'
            });
        }

        if (error.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        console.error('Create product error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

module.exports = {
    createProduct
};