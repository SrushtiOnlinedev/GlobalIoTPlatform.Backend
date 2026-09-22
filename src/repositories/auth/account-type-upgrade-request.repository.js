const createUpgradeRequest = async (connection, request) => {
    const [result] = await connection.execute(
        `
        INSERT INTO account_type_upgrade_requests
        (
            customer_id,
            current_account_type_id,
            requested_account_type_id,
            status
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            request.customerId,
            request.currentAccountTypeId,
            request.requestedAccountTypeId,
            1
        ]
    );

    return result.insertId;
};

module.exports = {
    createUpgradeRequest
};