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

module.exports = {
    createLoginAccount
};