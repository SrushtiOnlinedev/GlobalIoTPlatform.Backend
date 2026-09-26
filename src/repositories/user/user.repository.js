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

const getCurrentUser = async (connection, userPublicId, customerPublicId) => {
    const [rows] = await connection.execute(
        `
        SELECT
            u.public_id AS userPublicId,
            u.name,
            u.email,
            u.mobile,
            ut.name AS userType,
            at.name AS accountType,
            c.public_id AS customerPublicId,
            c.name AS customerName,
            c.email AS customerEmail
        FROM users u
        INNER JOIN customers c
            ON c.id = u.customer_id
        INNER JOIN user_types ut
            ON ut.id = u.user_type
            AND ut.status = 1
        INNER JOIN customer_login_accounts cla
            ON cla.user_id = u.id
            AND cla.customer_id = c.id
            AND cla.status = 1
        INNER JOIN account_types at
            ON at.id = cla.actual_account_type_id
            AND at.status = 1
        WHERE u.public_id = ?
          AND c.public_id = ?
          AND u.status = 1
          AND c.status = 1
        LIMIT 1
        `,
        [userPublicId, customerPublicId]
    );

    if (!rows[0]) {
        return null;
    }

    const row = rows[0];

    return {
        userPublicId: row.userPublicId,
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        userType: row.userType,
        accountType: row.accountType,
        customer: {
            customerPublicId: row.customerPublicId,
            name: row.customerName,
            email: row.customerEmail
        }
    };
};

module.exports = {
    createUser,
    assignRole,
    getRolesByUserId,
    getCurrentUser
};