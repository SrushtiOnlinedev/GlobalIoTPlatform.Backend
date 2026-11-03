const getProductByPublicId = async (
    connection,
    productPublicId
) => {
    const [rows] = await connection.execute(
        `
        SELECT
            id,
            public_id,
            status
        FROM products
        WHERE public_id = ?
        LIMIT 1
        `,
        [productPublicId]
    );

    return rows[0] || null;
};

const getOrganizationByPublicId = async (
    connection,
    organizationPublicId
) => {
    const [rows] = await connection.execute(
        `
        SELECT
            id,
            public_id,
            status
        FROM organizations
        WHERE public_id = ?
        LIMIT 1
        `,
        [organizationPublicId]
    );

    return rows[0] || null;
};

const getLocationByPublicId = async (
    connection,
    locationPublicId
) => {
    const [rows] = await connection.execute(
        `
        SELECT
            id,
            public_id,
            organization_id,
            status
        FROM locations
        WHERE public_id = ?
        LIMIT 1
        `,
        [locationPublicId]
    );

    return rows[0] || null;
};

const createDevice = async (
    connection,
    device
) => {
    const [result] = await connection.execute(
        `
        INSERT INTO devices
        (
            public_id,
            device_code,
            organization_id,
            location_id,
            product_id,
            device_name,
            serial_number,
            model_number,
            mac_address,
            imei_number,
            sim_number,
            activation_key,
            qr_code,
            manufacture_date,
            installation_date,
            warranty_expiry,
            status,
            remarks,
            created_by_user_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            device.publicId,
            device.deviceCode,
            device.organizationId,
            device.locationId,
            device.productId,
            device.deviceName,
            device.serialNumber,
            device.modelNumber,
            device.macAddress,
            device.imeiNumber,
            device.simNumber,
            device.activationKey,
            device.qrCode,
            device.manufactureDate,
            device.installationDate,
            device.warrantyExpiry,
            1,
            device.remarks,
            device.createdByUserId
        ]
    );

    return result.insertId;
};

const getDevices = async (
    connection,
    page,
    pageSize
) => {
    const offset = (page - 1) * pageSize;

    const [rows] = await connection.execute(
        `
        SELECT
            d.public_id AS devicePublicId,
            d.device_code AS deviceCode,
            d.device_name AS deviceName,
            d.serial_number AS serialNumber,
            d.model_number AS modelNumber,
            d.mac_address AS macAddress,
            d.imei_number AS imeiNumber,
            d.sim_number AS simNumber,

            DATE_FORMAT(
                d.manufacture_date, '%Y-%m-%d'
            ) AS manufactureDate,

            DATE_FORMAT(
                d.installation_date, '%Y-%m-%d'
            ) AS installationDate,

            DATE_FORMAT(
                d.warranty_expiry, '%Y-%m-%d'
            ) AS warrantyExpiry,

            d.status,
            d.remarks,
            d.created_at AS createdAt,
            d.updated_at AS updatedAt,

            p.public_id AS productPublicId,
            p.name AS productName,
            p.model_number AS productModelNumber,

            o.public_id AS organizationPublicId,
            o.name AS organizationName,

            l.public_id AS locationPublicId,
            l.name AS locationName

        FROM devices d

        INNER JOIN products p
            ON p.id = d.product_id

        LEFT JOIN organizations o
            ON o.id = d.organization_id

        LEFT JOIN locations l
            ON l.id = d.location_id

        ORDER BY d.created_at DESC, d.id DESC
        LIMIT ? OFFSET ?
        `,
        [pageSize, offset]
    );

    const [countRows] = await connection.execute(
        'SELECT COUNT(*) AS totalItems FROM devices'
    );

    return {
        devices: rows,
        totalItems: Number(countRows[0].totalItems)
    };
};

const getDeviceByPublicId = async (
    connection,
    devicePublicId
) => {
    const [rows] = await connection.execute(
        `
        SELECT
            d.public_id AS devicePublicId,
            d.device_code AS deviceCode,
            d.device_name AS deviceName,
            d.serial_number AS serialNumber,
            d.model_number AS modelNumber,
            d.mac_address AS macAddress,
            d.imei_number AS imeiNumber,
            d.sim_number AS simNumber,

            DATE_FORMAT(
                d.manufacture_date, '%Y-%m-%d'
            ) AS manufactureDate,

            DATE_FORMAT(
                d.installation_date, '%Y-%m-%d'
            ) AS installationDate,

            DATE_FORMAT(
                d.warranty_expiry, '%Y-%m-%d'
            ) AS warrantyExpiry,

            d.status,
            d.remarks,
            d.created_at AS createdAt,
            d.updated_at AS updatedAt,

            p.public_id AS productPublicId,
            p.name AS productName,
            p.model_number AS productModelNumber,

            o.public_id AS organizationPublicId,
            o.name AS organizationName,

            l.public_id AS locationPublicId,
            l.name AS locationName

        FROM devices d

        INNER JOIN products p
            ON p.id = d.product_id

        LEFT JOIN organizations o
            ON o.id = d.organization_id

        LEFT JOIN locations l
            ON l.id = d.location_id

        WHERE d.public_id = ?
        LIMIT 1
        `,
        [devicePublicId]
    );

    return rows[0] || null;
};

module.exports = {
    getProductByPublicId,
    getOrganizationByPublicId,
    getLocationByPublicId,
    createDevice,
    getDevices,
    getDeviceByPublicId
};