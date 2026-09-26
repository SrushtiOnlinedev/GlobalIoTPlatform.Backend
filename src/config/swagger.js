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
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },

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
                            example: 'Example Customer'
                        },
                        requestedAccountType: {
                            type: 'string',
                            example: 'Business'
                        },
                        customerEmail: {
                            type: 'string',
                            format: 'email',
                            example: 'customer@example.com'
                        },
                        mobile: {
                            type: 'string',
                            example: '9990000000'
                        },
                        address: {
                            type: 'string',
                            example: '123 Example Street'
                        },
                        city: {
                            type: 'string',
                            example: 'Example City'
                        },
                        state: {
                            type: 'string',
                            example: 'Example State'
                        },
                        country: {
                            type: 'string',
                            example: 'Example Country'
                        },
                        pincode: {
                            type: 'string',
                            example: '123456'
                        },
                        name: {
                            type: 'string',
                            example: 'Example User'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
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
                            example: 'user@example.com'
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
                },

                CurrentUserResponse: {
                    type: 'object',
                    required: [
                        'message',
                        'user'
                    ],
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Current user retrieved successfully.'
                        },
                        user: {
                            type: 'object',
                            required: [
                                'userPublicId',
                                'name',
                                'email',
                                'mobile',
                                'userType',
                                'accountType',
                                'customer'
                            ],
                            properties: {
                                userPublicId: {
                                    type: 'string',
                                    format: 'uuid'
                                },
                                name: {
                                    type: 'string',
                                    example: 'Example User'
                                },
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    example: 'user@example.com'
                                },
                                mobile: {
                                    type: 'string',
                                    example: '9990000000'
                                },
                                userType: {
                                    type: 'string',
                                    example: 'Customer Owner'
                                },
                                accountType: {
                                    type: 'string',
                                    example: 'End User'
                                },
                                customer: {
                                    type: 'object',
                                    required: [
                                        'customerPublicId',
                                        'name',
                                        'email'
                                    ],
                                    properties: {
                                        customerPublicId: {
                                            type: 'string',
                                            format: 'uuid'
                                        },
                                        name: {
                                            type: 'string',
                                            example: 'Example Customer'
                                        },
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            example: 'customer@example.com'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },

                ValidationErrorResponse: {
                    type: 'object',
                    required: [
                        'message',
                        'errors'
                    ],
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Validation failed'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: [
                                    'field',
                                    'message'
                                ],
                                properties: {
                                    field: {
                                        type: 'string',
                                        example: 'password'
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Password must contain at least one uppercase letter'
                                    }
                                }
                            }
                        }
                    }
                },

                MessageResponse: {
                    type: 'object',
                    required: [
                        'message'
                    ],
                    properties: {
                        message: {
                            type: 'string',
                            example: 'An unexpected error occurred.'
                        }
                    }
                },

                HealthResponse: {
                    type: 'object',
                    required: [
                        'status',
                        'message',
                        'database'
                    ],
                    properties: {
                        status: {
                            type: 'string',
                            example: 'OK'
                        },
                        message: {
                            type: 'string',
                            example: 'Global IoT Platform API is running'
                        },
                        database: {
                            type: 'string',
                            enum: [
                                'Connected',
                                'Not Connected'
                            ],
                            example: 'Connected'
                        }
                    }
                },

                HealthErrorResponse: {
                    type: 'object',
                    required: [
                        'status',
                        'message'
                    ],
                    properties: {
                        status: {
                            type: 'string',
                            example: 'ERROR'
                        },
                        message: {
                            type: 'string',
                            example: 'Database connection failed'
                        }
                    }
                },
            }
        }
    },

    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;