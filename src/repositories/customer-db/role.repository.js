const createRole = async (connection, role) => {
    const [result] = await connection.execute(
        `
        INSERT INTO roles
        (
            public_id,
            name,
            description,
            status,
            created_by_user_id
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            role.publicId,
            role.name,
            role.description,
            role.status,
            role.createdByUserId
        ]
    );

    return result.insertId;
};

const getRoleByName = async (connection, name) => {
    const [rows] = await connection.execute(
        `
        SELECT id, public_id
        FROM roles
        WHERE name = ?
        LIMIT 1
        `,
        [name]
    );

    return rows[0] || null;
};

const getRolesWithPermissions = async (connection) => {
    const [rows] = await connection.execute(`
        SELECT
            r.id,
            r.public_id,
            r.name,
            r.description,
            r.status,
            rp.permission_code
        FROM roles r
        LEFT JOIN role_permissions rp
            ON rp.role_id = r.id
        ORDER BY r.name, rp.permission_code
    `);

    return rows;
};

const getRoleByPublicId = async (connection, publicId) => {
    const [rows] = await connection.execute(
        `
        SELECT id, public_id, name, description, status
        FROM roles
        WHERE public_id = ?
        LIMIT 1
        `,
        [publicId]
    );

    return rows[0] || null;
};

const updateRole = async (connection, roleId, role) => {
    await connection.execute(
        `
        UPDATE roles
        SET name = ?, description = ?
        WHERE id = ?
        `,
        [
            role.name,
            role.description,
            roleId
        ]
    );
};

const updateRoleStatus = async (connection, roleId, status) => {
    await connection.execute(
        `
        UPDATE roles
        SET status = ?
        WHERE id = ?
        `,
        [status, roleId]
    );
};

module.exports = {
    createRole,
    getRoleByName,
    getRolesWithPermissions,
    getRoleByPublicId,
    updateRole,
    updateRoleStatus
};