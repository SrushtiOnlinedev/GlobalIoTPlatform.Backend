const crypto = require('crypto');

const db = require('../config/database');

const customerRepository = require('../repositories/customer/customer.repository');
const userRepository = require('../repositories/user/user.repository');
const productRepository = require('../repositories/product/product.repository');

const createProduct = async (
    data,
    userPublicId,
    customerPublicId
) => {
    const connection = await db.getConnection();

    try {
        const customer = await customerRepository.getCustomerByPublicId(
            connection,
            customerPublicId
        );

        if (!customer) {
            const error = new Error('Customer not found.');
            error.code = 'CUSTOMER_NOT_FOUND';
            throw error;
        }

        const user = await userRepository.getUserByPublicId(
            connection,
            userPublicId,
            customer.id
        );

        if (!user) {
            const error = new Error('User not found.');
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        const productPublicId = crypto.randomUUID();

        const productId = await productRepository.createProduct(
            connection,
            {
                publicId: productPublicId,
                customerId: customer.id,
                name: data.name,
                modelNumber: data.modelNumber ?? null,
                description: data.description ?? null,
                status: 1,
                createdByUserId: user.id
            }
        );

        return {
            productId,
            productPublicId
        };
    } finally {
        connection.release();
    }
};

module.exports = {
    createProduct
};