const { z } = require('zod');

const createRoleDto = z.object({
    name: z.string()
    .trim()
    .min(2)
    .max(100)
    .transform(value => value.replace(/\s+/g, ' ')),

    description: z.string().trim().max(500).optional(),

    permissionCodes: z.array(
        z.string().trim().min(1).max(100)
    ).default([])
}).refine(
    data => new Set(data.permissionCodes).size === data.permissionCodes.length,
    {
        path: ['permissionCodes'],
        message: 'Duplicate permission codes are not allowed.'
    }
);

module.exports = createRoleDto;