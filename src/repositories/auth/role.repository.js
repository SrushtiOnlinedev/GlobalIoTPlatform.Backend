const createRole = async (connection, role) => {
    const [result] = await connection.execute(
        `
        INSERT INTO roles
        (
            customer_id,
            name,
            description,
            status
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            role.customerId,
            role.name,
            role.description,
            1
        ]
    );

    return result.insertId;
};

module.exports = {
    createRole
};