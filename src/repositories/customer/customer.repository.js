const createCustomer = async (connection, customer) => {
    const [result] = await connection.execute(
        `
        INSERT INTO customers
        (
            public_id,
            name,
            email,
            mobile,
            account_type_id,
            address,
            city,
            state,
            country,
            pincode,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            customer.publicId,
            customer.name,
            customer.email,
            customer.mobile,
            customer.accountTypeId,
            customer.address,
            customer.city,
            customer.state,
            customer.country,
            customer.pincode,
            1
        ]
    );

    return result.insertId;
};

const getCustomerByPublicId = async (connection, publicId) => {
    const [rows] = await connection.execute(
        `
        SELECT id, public_id
        FROM customers
        WHERE public_id = ?
          AND status = 1
        LIMIT 1
        `,
        [publicId]
    );

    return rows[0] || null;
};

const getCustomerContextByPublicId = async (
    connection,
    publicId
) => {
    const [rows] = await connection.execute(
        `
        SELECT
            c.id,
            c.public_id AS customer_public_id,
            c.name AS customer_name,
            c.email AS customer_email,
            at.name AS account_type
        FROM customers c

        INNER JOIN account_types at
            ON at.id = c.account_type_id
           AND at.status = 1

        WHERE c.public_id = ?
          AND c.status = 1

        LIMIT 1
        `,
        [publicId]
    );

    return rows[0] || null;
};

module.exports = {
    createCustomer,
    getCustomerByPublicId,
    getCustomerContextByPublicId
};