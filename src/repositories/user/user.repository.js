const createUser = async (connection, user) => {
    const [result] = await connection.execute(
        `
        INSERT INTO users
        (
            public_id,
            customer_id,
            parent_user_id,
            name,
            email,
            mobile,
            user_type,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            user.publicId,
            user.customerId,
            user.parentUserId,
            user.name,
            user.email,
            user.mobile,
            user.userType,
            user.status
        ]
    );

    return result.insertId;
};

const assignRole = async (
    connection,
    customerId,
    userId,
    roleId,
    assignedByUserId = null
) => {
    await connection.execute(
        `
        INSERT INTO user_roles
        (
            customer_id,
            user_id,
            role_id,
            assigned_by_user_id
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            customerId,
            userId,
            roleId,
            assignedByUserId
        ]
    );
};

const getRolesByUserId = async (
    connection,
    customerId,
    userId
) => {
    const [rows] = await connection.execute(
        `
        SELECT
            r.id,
            r.name
        FROM user_roles ur
        JOIN roles r
            ON r.id = ur.role_id
        WHERE ur.customer_id = ?
          AND ur.user_id = ?
          AND r.status = 1
        ORDER BY r.id
        `,
        [
            customerId,
            userId
        ]
    );

    return rows;
};

module.exports = {
    createUser,
    assignRole,
    getRolesByUserId
};