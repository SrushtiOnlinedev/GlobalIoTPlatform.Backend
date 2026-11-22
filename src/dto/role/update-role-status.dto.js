const { z } = require('zod');

const updateRoleStatusDto = z.object({
    status: z.number().int().min(0).max(1)
});

module.exports = updateRoleStatusDto;