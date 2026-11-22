const getActivePermissionCodes = async (connection) => {
    const [rows] = await connection.execute(
        `
        SELECT code
        FROM permissions
        WHERE status = 1
        ORDER BY id
        `
    );

    return rows.map(row => row.code);
};

const getActivePermissions = async (connection) => {
    const [rows] = await connection.execute(`
        SELECT code, name, description
        FROM permissions
        WHERE status = 1
        ORDER BY id
    `);

    return rows;
};

module.exports = {
    getActivePermissionCodes,
    getActivePermissions
};