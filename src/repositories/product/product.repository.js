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

const getActiveProducts = async (connection) => {
    const [rows] = await connection.execute(
        `
        SELECT
            public_id AS productPublicId,
            name,
            model_number AS modelNumber,
            description
        FROM products
        WHERE status = 1
        ORDER BY name ASC
        `
    );

    return rows;
};

module.exports = {
    createProduct,
    getActiveProducts
};