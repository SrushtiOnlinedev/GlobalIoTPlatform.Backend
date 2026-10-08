const assignPermissions = async (
    connection,
    roleId,
    permissionCodes
) => {
    for (const permissionCode of permissionCodes) {
        await connection.execute(
            `
            INSERT IGNORE INTO role_permissions
            (
                role_id,
                permission_code
            )
            VALUES (?, ?)
            `,
            [
                roleId,
                permissionCode
            ]
        );
    }
};

module.exports = {
    assignPermissions
};