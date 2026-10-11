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
                    },
                    example: {
                        message: 'Current user retrieved successfully.',
                        user: {
                            userPublicId:
                                '00000000-0000-4000-8000-000000000010',
                            name: 'Example User',
                            email: 'user@example.com',
                            mobile: '9000000000',
                            userType: 'CUSTOMER_OWNER',
                            accountType: 'End User',
                            customer: {
                                customerPublicId:
                                    '00000000-0000-4000-8000-000000000020',
                                name: 'Example Customer',
                                email: 'customer@example.com'
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

                ProductListResponse: {
                    type: 'object',
                    required: ['products'],
                    properties: {
                        products: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: [
                                    'productPublicId',
                                    'name'
                                ],
                                properties: {
                                    productPublicId: {
                                        type: 'string',
                                        format: 'uuid'
                                    },
                                    name: {
                                        type: 'string',
                                        example: 'Example Product'
                                    },
                                    modelNumber: {
                                        type: 'string',
                                        nullable: true,
                                        example: 'Example Model'
                                    },
                                    description: {
                                        type: 'string',
                                        nullable: true,
                                        example: 'Example product description'
                                    }
                                },
                                example: {
                                    products: [
                                        {
                                            productPublicId:
                                                '00000000-0000-4000-8000-000000000001',
                                            name: 'Example Product',
                                            modelNumber: 'EXAMPLE-MODEL',
                                            description: 'Example product description'
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },

                CreateDeviceRequest: {
                    type: 'object',

                    required: [
                        'serialNumber',
                        'productPublicId'
                    ],

                    properties: {
                        deviceName: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 150,
                            example: 'Example Device'
                        },

                        serialNumber: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            example: 'EXAMPLE-SERIAL-001'
                        },

                        modelNumber: {
                            type: 'string',
                            maxLength: 100,
                            example: 'EXAMPLE-MODEL'
                        },

                        productPublicId: {
                            type: 'string',
                            format: 'uuid',
                            description:
                                'Replace this placeholder with an active productPublicId returned by GET /api/products.',
                            example:
                                '00000000-0000-4000-8000-000000000001'
                        },

                        organizationPublicId: {
                            type: 'string',
                            format: 'uuid',
                            description:
                                'Optional. Use an existing organization public ID.',
                            example:
                                '00000000-0000-4000-8000-000000000002'
                        },

                        locationPublicId: {
                            type: 'string',
                            format: 'uuid',
                            description:
                                'Optional. Use an existing location public ID.',
                            example:
                                '00000000-0000-4000-8000-000000000003'
                        },

                        macAddress: {
                            type: 'string',
                            maxLength: 50,
                            example: 'EXAMPLE-MAC'
                        },

                        imeiNumber: {
                            type: 'string',
                            maxLength: 50,
                            example: 'EXAMPLE-IMEI'
                        },

                        simNumber: {
                            type: 'string',
                            maxLength: 30,
                            example: 'EXAMPLE-SIM'
                        },

                        activationKey: {
                            type: 'string',
                            maxLength: 100,
                            example: 'EXAMPLE-ACTIVATION-KEY'
                        },

                        qrCode: {
                            type: 'string',
                            maxLength: 255,
                            example: 'EXAMPLE-QR-CODE'
                        },

                        manufactureDate: {
                            type: 'string',
                            format: 'date',
                            example: '2000-01-01'
                        },

                        installationDate: {
                            type: 'string',
                            format: 'date',
                            example: '2000-01-01'
                        },

                        warrantyExpiry: {
                            type: 'string',
                            format: 'date',
                            example: '2000-01-01'
                        },

                        remarks: {
                            type: 'string',
                            maxLength: 5000,
                            example: 'Example registration note'
                        }
                    },

                    example: {
                        deviceName: 'Example Device',
                        serialNumber: 'EXAMPLE-SERIAL-001',
                        modelNumber: 'EXAMPLE-MODEL',
                        productPublicId:
                            '00000000-0000-4000-8000-000000000001',
                        remarks: 'Example registration note'
                    }
                },

                DeviceListResponse: {
                    type: 'object',
                    required: ['devices', 'pagination'],
                    properties: {
                        devices: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    devicePublicId: { type: 'string', format: 'uuid' },
                                    deviceCode: { type: 'string', example: 'DEV-A1B2C3D4' },
                                    deviceName: { type: 'string', nullable: true },
                                    serialNumber: { type: 'string' },
                                    modelNumber: { type: 'string', nullable: true },
                                    macAddress: { type: 'string', nullable: true },
                                    imeiNumber: { type: 'string', nullable: true },
                                    simNumber: { type: 'string', nullable: true },
                                    manufactureDate: { type: 'string', format: 'date', nullable: true },
                                    installationDate: { type: 'string', format: 'date', nullable: true },
                                    warrantyExpiry: { type: 'string', format: 'date', nullable: true },
                                    status: { type: 'integer', example: 1 },
                                    remarks: { type: 'string', nullable: true },
                                    createdAt: { type: 'string', format: 'date-time' },
                                    updatedAt: { type: 'string', format: 'date-time' },
                                    productPublicId: { type: 'string', format: 'uuid' },
                                    productName: { type: 'string', example: 'Example Product' },
                                    productModelNumber: { type: 'string', nullable: true },
                                    organizationPublicId: { type: 'string', format: 'uuid', nullable: true },
                                    organizationName: { type: 'string', nullable: true },
                                    locationPublicId: { type: 'string', format: 'uuid', nullable: true },
                                    locationName: { type: 'string', nullable: true }
                                }
                            }
                        },
                        pagination: {
                            type: 'object',
                            required: [
                                'page',
                                'pageSize',
                                'totalItems',
                                'totalPages'
                            ],
                            properties: {
                                page: { type: 'integer', example: 1 },
                                pageSize: { type: 'integer', example: 20 },
                                totalItems: { type: 'integer', example: 0 },
                                totalPages: { type: 'integer', example: 0 }
                            }
                        }
                    },
                    example: {
                        devices: [
                            {
                                devicePublicId:
                                    '00000000-0000-4000-8000-000000000010',
                                deviceCode: 'DEV-00000000',
                                deviceName: 'Example Device',
                                serialNumber: 'EXAMPLE-SERIAL-001',
                                modelNumber: 'EXAMPLE-MODEL',
                                macAddress: null,
                                imeiNumber: null,
                                simNumber: null,
                                manufactureDate: null,
                                installationDate: null,
                                warrantyExpiry: null,
                                status: 1,
                                remarks: 'Example registration note',
                                createdAt: '2000-01-01T00:00:00.000Z',
                                updatedAt: '2000-01-01T00:00:00.000Z',
                                productPublicId:
                                    '00000000-0000-4000-8000-000000000001',
                                productName: 'Example Product',
                                productModelNumber: 'EXAMPLE-PRODUCT-MODEL',
                                organizationPublicId: null,
                                organizationName: null,
                                locationPublicId: null,
                                locationName: null
                            }
                        ],
                        pagination: {
                            page: 1,
                            pageSize: 20,
                            totalItems: 1,
                            totalPages: 1
                        }
                    }
                },

                DeviceDetailsResponse: {
                    type: 'object',
                    required: ['message', 'device'],
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Device retrieved successfully.'
                        },
                        device: {
                            type: 'object',
                            properties: {
                                devicePublicId: { type: 'string', format: 'uuid' },
                                deviceCode: { type: 'string', example: 'DEV-00000000' },
                                deviceName: { type: 'string', nullable: true },
                                serialNumber: { type: 'string', example: 'EXAMPLE-SERIAL-001' },
                                modelNumber: { type: 'string', nullable: true },
                                macAddress: { type: 'string', nullable: true },
                                imeiNumber: { type: 'string', nullable: true },
                                simNumber: { type: 'string', nullable: true },
                                manufactureDate: { type: 'string', format: 'date', nullable: true },
                                installationDate: { type: 'string', format: 'date', nullable: true },
                                warrantyExpiry: { type: 'string', format: 'date', nullable: true },
                                status: { type: 'integer', example: 1 },
                                remarks: { type: 'string', nullable: true },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' },
                                productPublicId: { type: 'string', format: 'uuid' },
                                productName: { type: 'string', example: 'Example Product' },
                                productModelNumber: { type: 'string', nullable: true },
                                organizationPublicId: { type: 'string', format: 'uuid', nullable: true },
                                organizationName: { type: 'string', nullable: true },
                                locationPublicId: { type: 'string', format: 'uuid', nullable: true },
                                locationName: { type: 'string', nullable: true }
                            }
                        }
                    },
                    example: {
                        message: 'Device retrieved successfully.',
                        device: {
                            devicePublicId: '00000000-0000-4000-8000-000000000010',
                            deviceCode: 'DEV-00000000',
                            deviceName: 'Example Device',
                            serialNumber: 'EXAMPLE-SERIAL-001',
                            modelNumber: 'EXAMPLE-MODEL',
                            macAddress: null,
                            imeiNumber: null,
                            simNumber: null,
                            manufactureDate: null,
                            installationDate: null,
                            warrantyExpiry: null,
                            status: 1,
                            remarks: 'Example registration note',
                            createdAt: '2000-01-01T00:00:00.000Z',
                            updatedAt: '2000-01-01T00:00:00.000Z',
                            productPublicId: '00000000-0000-4000-8000-000000000001',
                            productName: 'Example Product',
                            productModelNumber: 'EXAMPLE-PRODUCT-MODEL',
                            organizationPublicId: null,
                            organizationName: null,
                            locationPublicId: null,
                            locationName: null
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