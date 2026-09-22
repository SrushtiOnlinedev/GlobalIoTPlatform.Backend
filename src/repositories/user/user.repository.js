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

module.exports = {
    createUser,
    assignRole
};