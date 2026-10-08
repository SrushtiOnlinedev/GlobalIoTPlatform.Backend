const createLoginAccount = async (connection, account) => {
    const [result] = await connection.execute(
        `
        INSERT INTO customer_login_accounts
        (
            public_id,
            customer_id,
            user_public_id,
            email,
            password_hash,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            account.publicId,
            account.customerId,
            account.userPublicId,
            account.email,
            account.passwordHash,
            account.status
        ]
    );

    return result.insertId;
};

const getLoginAccountByEmail = async (connection, email) => {
    const [rows] = await connection.execute(
        `
        SELECT
            cla.id,
            cla.public_id,
            cla.customer_id,
            cla.user_public_id,
            cla.email,
            cla.password_hash,
            cla.status AS login_account_status,

            c.public_id AS customer_public_id,
            c.status AS customer_status,

            cd.database_name,
            cd.database_host,
            cd.database_port,
            cd.status AS database_status,
            cd.provisioning_status

        FROM customer_login_accounts cla

        INNER JOIN customers c
            ON c.id = cla.customer_id

        INNER JOIN customer_databases cd
            ON cd.customer_id = c.id

        WHERE cla.email = ?

        LIMIT 1
        `,
        [email]
    );

    return rows[0] || null;
};

const updateLastLogin = async (connection, loginAccountId) => {
    await connection.execute(
        `
        UPDATE customer_login_accounts
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [loginAccountId]
    );
};

module.exports = {
    createLoginAccount,
    getLoginAccountByEmail,
    updateLastLogin
};