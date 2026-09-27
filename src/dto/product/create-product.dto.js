const { z } = require('zod');

const createProductDto = z.object({
    name: z.string().trim().min(2).max(200),
    modelNumber: z.string().trim().max(100).optional(),
    description: z.string().trim().max(1000).optional()
});

module.exports = createProductDto;