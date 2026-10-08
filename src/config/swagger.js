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
                            minLength: 2,
                            maxLength: 200,
                            example: 'Example Customer'
                        },
                        requestedAccountType: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 100,
                            example: 'Business'
                        },
                        customerEmail: {
                            type: 'string',
                            format: 'email',
                            maxLength: 320,
                            example: 'customer@example.com'
                        },
                        mobile: {
                            type: 'string',
                            minLength: 7,
                            maxLength: 30,
                            example: '9990000000'
                        },
                        address: {
                            type: 'string',
                            maxLength: 500,
                            example: '123 Example Street'
                        },
                        city: {
                            type: 'string',
                            maxLength: 100,
                            example: 'Example City'
                        },
                        state: {
                            type: 'string',
                            maxLength: 100,
                            example: 'Example State'
                        },
                        country: {
                            type: 'string',
                            maxLength: 100,
                            example: 'Example Country'
                        },
                        pincode: {
                            type: 'string',
                            maxLength: 20,
                            example: '123456'
                        },
                        name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 200,
                            example: 'Example User'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            maxLength: 320,
                            example: 'user@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            maxLength: 100,
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
                            maxLength: 320,
                            example: 'user@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 1,
                            maxLength: 100,
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
                                    example: 'CUSTOMER_OWNER'
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

                CreateProductRequest: {
                    type: 'object',
                    required: [
                        'name'
                    ],
                    properties: {
                        name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 200,
                            example: 'Example Product'
                        },
                        modelNumber: {
                            type: 'string',
                            maxLength: 100,
                            example: 'Example Model'
                        },
                        description: {
                            type: 'string',
                            maxLength: 1000,
                            example: 'Example product description'
                        }
                    }
                },

                CreateProductResponse: {
                    type: 'object',
                    required: [
                        'message'
                    ],
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Product created successfully.'
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