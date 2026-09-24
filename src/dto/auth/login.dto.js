const { z } = require('zod');

const loginDto = z.object({
    email: z
        .string()
        .trim()
        .email()
        .max(320),

    password: z
        .string()
        .min(1)
        .max(100)
});

module.exports = loginDto;