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

const replacePermissions = async (
    connection,
    roleId,
    permissionCodes
) => {
    await connection.execute(
        'DELETE FROM role_permissions WHERE role_id = ?',
        [roleId]
    );

    await assignPermissions(
        connection,
        roleId,
        permissionCodes
    );
};

module.exports = {
    assignPermissions,
    replacePermissions
};