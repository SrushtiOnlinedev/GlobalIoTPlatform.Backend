const createCustomer = async (connection, customer) => {
    const [result] = await connection.execute(
        `
        INSERT INTO customers
        (
            public_id,
            name,
            email,
            mobile,
            address,
            city,
            state,
            country,
            pincode,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            customer.publicId,
            customer.name,
            customer.email,
            customer.mobile,
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

module.exports = {
    createCustomer
};