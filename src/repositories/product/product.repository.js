const createProduct = async (connection, product) => {
    const [result] = await connection.execute(
        `
        INSERT INTO products
        (
            public_id,
            name,
            model_number,
            description,
            status,
            created_by_user_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            product.publicId,
            product.name,
            product.modelNumber,
            product.description,
            product.status,
            product.createdByUserId
        ]
    );

    return result.insertId;
};

module.exports = {
    createProduct
};