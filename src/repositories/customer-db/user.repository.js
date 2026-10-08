const createUser = async (connection, user) => {
    const [result] = await connection.execute(
        `
        INSERT INTO users
        (
            public_id,
            parent_user_id,
            name,
            email,
            mobile,
            user_type_code,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            user.publicId,
            user.parentUserId,
            user.name,
            user.email,
            user.mobile,
            user.userTypeCode,
            user.status
        ]
    );

    return result.insertId;
};

const getUserByPublicId = async (
    connection,
    publicId
) => {
    const [rows] = await connection.execute(
        `
        SELECT
            id,
            public_id,
            name,
            email,
            mobile,
            user_type_code,
            status
        FROM users
        WHERE public_id = ?
        LIMIT 1
        `,
        [publicId]
    );

    return rows[0] || null;
};

module.exports = {
    createUser,
    getUserByPublicId
};