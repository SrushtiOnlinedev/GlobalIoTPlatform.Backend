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

module.exports = {
    getActivePermissionCodes
};