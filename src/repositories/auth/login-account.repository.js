const createLoginAccount = async (connection, account) => {
    const [result] = await connection.execute(
        `
        INSERT INTO customer_login_accounts
        (
            public_id,
            customer_id,
            user_id,
            email,
            password_hash,
            actual_account_type_id,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            account.publicId,
            account.customerId,
            account.userId,
            account.email,
            account.passwordHash,
            account.actualAccountTypeId,
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
            cla.user_id,
            cla.email,
            cla.password_hash,
            cla.actual_account_type_id,
            cla.status AS login_account_status,

            at.name AS account_type,

            c.public_id AS customer_public_id,
            c.status AS customer_status,

            u.public_id AS user_public_id,
            u.name AS user_name,
            ut.name AS user_type,
            u.status AS user_status

        FROM customer_login_accounts cla

        JOIN account_types at
            ON at.id = cla.actual_account_type_id
            AND at.status = 1

        JOIN customers c
            ON c.id = cla.customer_id

        JOIN users u
            ON u.id = cla.user_id

        JOIN user_types ut
            ON ut.id = u.user_type
            AND ut.status = 1

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