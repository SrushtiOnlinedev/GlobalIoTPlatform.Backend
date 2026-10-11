const crypto = require('crypto');

const {
    getCustomerDatabaseConnection
} = require('./customer-db-connection.service');

const userRepository = require(
    '../repositories/customer-db/user.repository'
);

const deviceRepository = require(
    '../repositories/device/device.repository'
);

const createDevice = async (
    data,
    userPublicId,
    customerPublicId
) => {
    const customerDb =
        await getCustomerDatabaseConnection(
            customerPublicId
        );

    const user =
        await userRepository.getUserByPublicId(
            customerDb,
            userPublicId
        );

    if (!user || user.status !== 1) {
        const error = new Error('User not found.');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const product =
        await deviceRepository.getProductByPublicId(
            customerDb,
            data.productPublicId
        );

    if (!product || product.status !== 1) {
        const error = new Error('Product not found.');
        error.code = 'PRODUCT_NOT_FOUND';
        throw error;
    }

    let organizationId = null;
    let locationId = null;

    if (data.organizationPublicId) {
        const organization =
            await deviceRepository.getOrganizationByPublicId(
                customerDb,
                data.organizationPublicId
            );

        if (!organization || organization.status !== 1) {
            const error = new Error('Organization not found.');
            error.code = 'ORGANIZATION_NOT_FOUND';
            throw error;
        }

        organizationId = organization.id;
    }

    if (data.locationPublicId) {
        const location =
            await deviceRepository.getLocationByPublicId(
                customerDb,
                data.locationPublicId
            );

        if (!location || location.status !== 1) {
            const error = new Error('Location not found.');
            error.code = 'LOCATION_NOT_FOUND';
            throw error;
        }

        if (
            organizationId !== null &&
            location.organization_id !== organizationId
        ) {
            const error = new Error(
                'Location does not belong to organization.'
            );
            error.code = 'LOCATION_ORGANIZATION_MISMATCH';
            throw error;
        }

        locationId = location.id;
    }

    const devicePublicId = crypto.randomUUID();

    const deviceCode =
        `DEV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const deviceId =
        await deviceRepository.createDevice(
            customerDb,
            {
                publicId: devicePublicId,
                deviceCode,
                organizationId,
                locationId,
                productId: product.id,
                deviceName: data.deviceName ?? null,
                serialNumber: data.serialNumber,
                modelNumber: data.modelNumber ?? null,
                macAddress: data.macAddress ?? null,
                imeiNumber: data.imeiNumber ?? null,
                simNumber: data.simNumber ?? null,
                activationKey: data.activationKey ?? null,
                qrCode: data.qrCode ?? null,
                manufactureDate: data.manufactureDate ?? null,
                installationDate: data.installationDate ?? null,
                warrantyExpiry: data.warrantyExpiry ?? null,
                remarks: data.remarks ?? null,
                createdByUserId: user.id
            }
        );

    return {
        deviceId,
        devicePublicId,
        deviceCode
    };
};

const getDevices = async (
    userPublicId,
    customerPublicId,
    page,
    pageSize
) => {
    const customerDb =
        await getCustomerDatabaseConnection(
            customerPublicId
        );

    const user =
        await userRepository.getUserByPublicId(
            customerDb,
            userPublicId
        );

    if (!user || user.status !== 1) {
        const error = new Error('User not found.');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    return deviceRepository.getDevices(
        customerDb,
        page,
        pageSize
    );
};

const getDeviceByPublicId = async (
    userPublicId,
    customerPublicId,
    devicePublicId
) => {
    const customerDb =
        await getCustomerDatabaseConnection(
            customerPublicId
        );

    const user =
        await userRepository.getUserByPublicId(
            customerDb,
            userPublicId
        );

    if (!user || user.status !== 1) {
        const error = new Error('User not found.');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    const device =
        await deviceRepository.getDeviceByPublicId(
            customerDb,
            devicePublicId
        );

    if (!device) {
        const error = new Error('Device not found.');
        error.code = 'DEVICE_NOT_FOUND';
        throw error;
    }

    return device;
};

module.exports = {
    createDevice,
    getDevices,
    getDeviceByPublicId
};