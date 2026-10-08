const createProvisioningRecord = async (
    connection,
    database
) => {
    const [result] = await connection.execute(
        `
        INSERT INTO customer_databases
        (
            public_id,
            customer_id,
            database_name,
            database_host,
            database_port,
            status,
            provisioning_status,
            provisioning_attempts,
            provisioning_started_at
        )
        VALUES (?, ?, ?, ?, ?, 0, 'PROVISIONING', 1, CURRENT_TIMESTAMP)
        `,
        [
            database.publicId,
            database.customerId,
            database.databaseName,
            database.host,
            database.port
        ]
    );

    return result.insertId;
};

const markProvisioningFailed = async (
    connection,
    databaseId,
    errorMessage
) => {
    await connection.execute(
        `
        UPDATE customer_databases
        SET
            provisioning_status = 'FAILED',
            provisioning_failed_at = CURRENT_TIMESTAMP,
            provisioning_error = ?
        WHERE id = ?
        `,
        [
            errorMessage,
            databaseId
        ]
    );
};

const markProvisioningActive = async (
    connection,
    databaseId
) => {
    await connection.execute(
        `
        UPDATE customer_databases
        SET
            status = 1,
            provisioning_status = 'ACTIVE',
            provisioning_completed_at = CURRENT_TIMESTAMP,
            provisioning_error = NULL
        WHERE id = ?
        `,
        [databaseId]
    );
};

module.exports = {
    createProvisioningRecord,
    markProvisioningFailed,
    markProvisioningActive
};