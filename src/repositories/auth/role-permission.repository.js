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

module.exports = {
    assignAllActivePermissions
};