const crypto = require('crypto');

const {
    getCustomerDatabaseConnection
} = require('./customer-db-connection.service');

const userRepository = require(
    '../repositories/customer-db/user.repository'
);

const productRepository = require(
    '../repositories/product/product.repository'
);

const createProduct = async (
    data,
    userPublicId,
    customerPublicId
) => {
    const customerDb =
        await getCustomerDatabaseConnection(
            customerPublicId
        );

    const user =
        await userRepository.getUserByPublicId(
            customerDb,
            userPublicId
        );

    if (!user || user.status !== 1) {
        const error = new Error('User not found.');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const productPublicId = crypto.randomUUID();

    const productId =
        await productRepository.createProduct(
            customerDb,
            {
                publicId: productPublicId,
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
};

module.exports = {
    createProduct
};