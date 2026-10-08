const getUserPermissions = async (
    connection,
    userPublicId
) => {
    const [rows] = await connection.execute(
        `
        SELECT DISTINCT
            rp.permission_code
        FROM users u
        INNER JOIN user_roles ur
            ON ur.user_id = u.id
        INNER JOIN roles r
            ON r.id = ur.role_id
        INNER JOIN role_permissions rp
            ON rp.role_id = r.id
        WHERE u.public_id = ?
          AND u.status = 1
          AND r.status = 1
        ORDER BY rp.permission_code
        `,
        [userPublicId]
    );

    return rows.map(row => row.permission_code);
};

module.exports = {
    getUserPermissions
};