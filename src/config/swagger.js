const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',

        info: {
            title: 'Global IoT Platform API',
            version: '1.0.0',
            description: 'Backend API for the Global IoT Platform'
        },

        servers: [
            {
                url: 'http://localhost:3000'
            }
        ],

        components: {
            schemas: {
                RegisterRequest: {
                    type: 'object',
                    required: [
                        'customerName',
                        'customerEmail',
                        'mobile',
                        'name',
                        'email',
                        'password'
                    ],
                    properties: {
                        customerName: {
                            type: 'string',
                            example: 'Amit Patel'
                        },
                        requestedAccountType: {
                            type: 'string',
                            example: 'Business'
                        },
                        customerEmail: {
                            type: 'string',
                            format: 'email',
                            example: 'amit.customer@example.com'
                        },
                        mobile: {
                            type: 'string',
                            example: '9876543210'
                        },
                        address: {
                            type: 'string',
                            example: '123 Main Road'
                        },
                        city: {
                            type: 'string',
                            example: 'Surat'
                        },
                        state: {
                            type: 'string',
                            example: 'Gujarat'
                        },
                        country: {
                            type: 'string',
                            example: 'India'
                        },
                        pincode: {
                            type: 'string',
                            example: '395001'
                        },
                        name: {
                            type: 'string',
                            example: 'Amit Patel'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'amit@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'Password@123'
                        }
                    }
                },

                RegisterResponse: {
                    type: 'object',
                    required: [
                        'message'
                    ],
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Customer registered successfully.'
                        }
                    }
                },

                LoginRequest: {
                    type: 'object',
                    required: [
                        'email',
                        'password'
                    ],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'final.user@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'Password@123'
                        }
                    }
                },

                LoginResponse: {
                    type: 'object',
                    required: [
                        'message',
                        'accessToken',
                        'tokenType',
                        'expiresIn'
                    ],
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Login successful.'
                        },
                        accessToken: {
                            type: 'string'
                        },
                        tokenType: {
                            type: 'string',
                            example: 'Bearer'
                        },
                        expiresIn: {
                            type: 'string',
                            example: '1h'
                        }
                    }
                }
            }
        }
    },

    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;