const createDeviceDto = require(
    '../dto/device/create-device.dto'
);

const deviceService = require(
    '../services/device.service'
);

const {
    subscribeToDeviceTelemetry
} = require('../services/live-telemetry.service');

const { z } = require('zod');

const createDevice = async (req, res) => {
    try {
        const data = createDeviceDto.parse(req.body);

        const {
            userPublicId,
            customerPublicId
        } = req.auth;

        const result =
            await deviceService.createDevice(
                data,
                userPublicId,
                customerPublicId
            );

        return res.status(201).json({
            message: 'Device registered successfully.',
            device: {
                devicePublicId: result.devicePublicId,
                deviceCode: result.deviceCode
            },
            mqtt: {
                host: result.mqtt.mqttHost,
                port: result.mqtt.mqttPort,
                clientId: result.mqtt.mqttClientId,
                username: result.mqtt.mqttUsername,
                password: result.mqtt.mqttPassword,
                topic: result.mqtt.mqttTopic
            }
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        if (error.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (error.code === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        if (error.code === 'ORGANIZATION_NOT_FOUND') {
            return res.status(404).json({
                message: 'Organization not found.'
            });
        }

        if (error.code === 'LOCATION_NOT_FOUND') {
            return res.status(404).json({
                message: 'Location not found.'
            });
        }

        if (
            error.code ===
            'LOCATION_ORGANIZATION_MISMATCH'
        ) {
            return res.status(400).json({
                message:
                    'Location does not belong to organization.'
            });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Device with the provided details already exists.'
            });
        }

        console.error('Create device error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const getDevices = async (req, res) => {
    try {
        const querySchema = z.object({
            page: z.coerce.number().int().min(1).default(1),
            pageSize: z.coerce.number().int().min(1).max(100).default(20)
        });

        const { page, pageSize } =
            querySchema.parse(req.query);

        const { userPublicId, customerPublicId } = req.auth;

        const result = await deviceService.getDevices(
            customerPublicId,
            userPublicId,
            page,
            pageSize
        );

        return res.status(200).json({
            devices: result.devices,
            pagination: {
                page,
                pageSize,
                totalItems: result.totalItems,
                totalPages: Math.ceil(
                    result.totalItems / pageSize
                )
            }
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        if (error.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        console.error('Get devices error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const getDeviceByPublicId = async (req, res) => {
    try {
        const { devicePublicId } = z.object({
            devicePublicId: z.string().uuid()
        }).parse(req.params);

        const { userPublicId, customerPublicId } = req.auth;

        const device = await deviceService.getDeviceByPublicId(
            userPublicId,
            customerPublicId,
            devicePublicId
        );

        return res.status(200).json({
            message: 'Device retrieved successfully.',
            device
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        if (error.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (error.code === 'DEVICE_NOT_FOUND') {
            return res.status(404).json({
                message: 'Device not found.'
            });
        }

        console.error('Get device error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

const getLiveDeviceTelemetry = async (req, res) => {
    try {
        const { devicePublicId } = z.object({
            devicePublicId: z.string().uuid()
        }).parse(req.params);

        const { userPublicId, customerPublicId } = req.auth;

        const device = await deviceService.getDeviceByPublicId(
            userPublicId,
            customerPublicId,
            devicePublicId
        );

        return subscribeToDeviceTelemetry(
            customerPublicId,
            device.deviceCode,
            res
        );
    } catch (error) {
        if (res.headersSent) {
            console.error('Live telemetry stream error:', error);
            return res.end();
        }

        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        if (error.code === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (error.code === 'DEVICE_NOT_FOUND') {
            return res.status(404).json({
                message: 'Device not found.'
            });
        }

        console.error('Live telemetry error:', error);

        return res.status(500).json({
            message: 'An unexpected error occurred.'
        });
    }
};

module.exports = {
    createDevice,
    getDevices,
    getDeviceByPublicId,
    getLiveDeviceTelemetry
};