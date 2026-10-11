const { z } = require('zod');

const createDeviceDto = z.object({
    deviceName: z
        .string()
        .trim()
        .min(2)
        .max(150)
        .optional(),

    serialNumber: z
        .string()
        .trim()
        .min(1)
        .max(100),

    modelNumber: z
        .string()
        .trim()
        .max(100)
        .optional(),

    productPublicId: z
        .string()
        .uuid(),

    organizationPublicId: z
        .string()
        .uuid()
        .optional(),

    locationPublicId: z
        .string()
        .uuid()
        .optional(),

    macAddress: z
        .string()
        .trim()
        .max(50)
        .optional(),

    imeiNumber: z
        .string()
        .trim()
        .max(50)
        .optional(),

    simNumber: z
        .string()
        .trim()
        .max(30)
        .optional(),

    activationKey: z
        .string()
        .trim()
        .max(100)
        .optional(),

    qrCode: z
        .string()
        .trim()
        .max(255)
        .optional(),

    manufactureDate: z
        .string()
        .date()
        .optional(),

    installationDate: z
        .string()
        .date()
        .optional(),

    warrantyExpiry: z
        .string()
        .date()
        .optional(),

    remarks: z
        .string()
        .trim()
        .max(5000)
        .optional()
});

module.exports = createDeviceDto;