const { z } = require('zod');

const registerDto = z.object({
    customerName: z.string().trim().min(2).max(200),

    requestedAccountType: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

    customerEmail: z
        .string()
        .trim()
        .email()
        .max(320),

    mobile: z
        .string()
        .trim()
        .min(7)
        .max(30),

    address: z.string().trim().max(500).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    pincode: z.string().trim().max(20).optional(),

    name: z.string().trim().min(2).max(200),

    email: z
        .string()
        .trim()
        .email()
        .max(320),

    password: z
        .string()
        .min(8)
        .max(100)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(
            /[^A-Za-z0-9]/,
            'Password must contain at least one special character'
        )
});

module.exports = registerDto;