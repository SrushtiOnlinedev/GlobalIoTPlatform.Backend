const getByName = async (connection, name) => {
    const [rows] = await connection.execute(
        `
        SELECT id, name
        FROM user_types
        WHERE name = ?
          AND status = 1
        LIMIT 1
        `,
        [name]
    );

    return rows[0] || null;
};

module.exports = {
    getByName
};