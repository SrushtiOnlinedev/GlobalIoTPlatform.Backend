const createRole = async (connection, role) => {
    const [result] = await connection.execute(
        `
        INSERT INTO roles
        (
            public_id,
            name,
            description,
            status,
            created_by_user_id
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            role.publicId,
            role.name,
            role.description,
            role.status,
            role.createdByUserId
        ]
    );

    return result.insertId;
};

const getRoleByName = async (connection, name) => {
    const [rows] = await connection.execute(
        `
        SELECT id, public_id
        FROM roles
        WHERE name = ?
        LIMIT 1
        `,
        [name]
    );

    return rows[0] || null;
};

module.exports = {
    createRole,
    getRoleByName
};