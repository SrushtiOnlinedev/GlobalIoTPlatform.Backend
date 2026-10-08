const assignRole = async (
    connection,
    userId,
    roleId,
    assignedByUserId = null
) => {
    await connection.execute(
        `
        INSERT IGNORE INTO user_roles
        (
            user_id,
            role_id,
            assigned_by_user_id
        )
        VALUES (?, ?, ?)
        `,
        [
            userId,
            roleId,
            assignedByUserId
        ]
    );
};

module.exports = {
    assignRole
};