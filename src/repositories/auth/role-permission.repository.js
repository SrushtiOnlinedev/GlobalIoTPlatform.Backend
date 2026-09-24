const assignAllActivePermissions = async (connection, roleId) => {
    await connection.execute(
        `
        INSERT INTO role_permissions
        (
            role_id,
            permission_id
        )
        SELECT ?, id
        FROM permissions
        WHERE status = 1
        `,
        [roleId]
    );
};

const getPermissionsByUserId = async (
    connection,
    customerId,
    userId
) => {
    const [rows] = await connection.execute(
        `
        SELECT DISTINCT
            p.id,
            p.code,
            p.name,
            p.module
        FROM user_roles ur

        JOIN roles r
            ON r.id = ur.role_id

        JOIN role_permissions rp
            ON rp.role_id = r.id

        JOIN permissions p
            ON p.id = rp.permission_id

        WHERE ur.customer_id = ?
          AND ur.user_id = ?
          AND r.customer_id = ur.customer_id
          AND r.status = 1
          AND p.status = 1

        ORDER BY p.id
        `,
        [
            customerId,
            userId
        ]
    );

    return rows;
};

module.exports = {
    assignAllActivePermissions,
    getPermissionsByUserId
};