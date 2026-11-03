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

const deviceDatabaseRouteRepository = require(
    '../repositories/platform/device-database-route.repository'
);

const {
    provisionDeviceMqttAccess,
    revokeDeviceMqttAccess
} = require('./mqtt-provisioning.service');

const {
    getDeviceConnectionState
} = require('./live-telemetry.service');

const deviceMqttCredentialsRepository = require(
    '../repositories/platform/device-mqtt-credentials.repository'
);

const DEVICE_CONNECTION_TIMEOUT_SECONDS = Number(
    process.env.DEVICE_CONNECTION_TIMEOUT_SECONDS || 120
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

    let routeCreated = false;
    let mqttProvisioningAttempted = false;

    try {
        await deviceDatabaseRouteRepository.createDeviceRoute(
            deviceCode,
            customerPublicId
        );

        routeCreated = true;

        mqttProvisioningAttempted = true;

        const mqttAccess =
            await provisionDeviceMqttAccess(deviceCode);

        await deviceMqttCredentialsRepository.createDeviceMqttCredentials({
            deviceCode,
            host: mqttAccess.mqttHost,
            port: mqttAccess.mqttPort,
            clientId: mqttAccess.mqttClientId,
            username: mqttAccess.mqttUsername,
            topic: mqttAccess.mqttTopic
        });

        return {
            deviceId,
            devicePublicId,
            deviceCode,
            mqtt: mqttAccess
        };
    } catch (error) {
        if (mqttProvisioningAttempted) {
            try {
                await revokeDeviceMqttAccess(deviceCode);
            } catch (cleanupError) {
                console.error(
                    'Failed to revoke MQTT access after registration failure:',
                    cleanupError.message
                );
            }
        }

        try {
            await deviceMqttCredentialsRepository.deleteDeviceMqttCredentials(
                deviceCode
            );
        } catch (cleanupError) {
            console.error(
                'Failed to clean up MQTT metadata:',
                cleanupError.message
            );
        }

        if (routeCreated) {
            try {
                await deviceDatabaseRouteRepository.deleteDeviceRoute(
                    deviceCode
                );
            } catch (cleanupError) {
                console.error(
                    'Failed to clean up device route:',
                    cleanupError.message
                );
            }
        }

        try {
            await customerDb.execute(
                'DELETE FROM devices WHERE id = ?',
                [deviceId]
            );
        } catch (cleanupError) {
            console.error(
                'Failed to clean up device after registration failure:',
                cleanupError.message
            );
        }

        throw error;
    }
};

const getDevices = async (
    customerPublicId,
    userPublicId,
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

    const result = await deviceRepository.getDevices(
        customerDb,
        page,
        pageSize
    );

    return {
        ...result,
        devices: result.devices.map((device) => {
            const connectionState = getDeviceConnectionState(
                customerPublicId,
                device.deviceCode,
                DEVICE_CONNECTION_TIMEOUT_SECONDS
            );

            return {
                ...device,
                lastSeenAt: connectionState.lastSeenAt,
                connectionStatus: connectionState.connectionStatus
            };
        })
    };
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

    const connectionState = getDeviceConnectionState(
        customerPublicId,
        device.deviceCode,
        DEVICE_CONNECTION_TIMEOUT_SECONDS
    );

    return {
        ...device,
        lastSeenAt: connectionState.lastSeenAt,
        connectionStatus: connectionState.connectionStatus
    };
};

module.exports = {
    createDevice,
    getDevices,
    getDeviceByPublicId
};