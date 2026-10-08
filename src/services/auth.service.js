const crypto = require('crypto');
const bcrypt = require('bcrypt');

const db = require('../config/database');
const { jwtExpiresIn } = require('../config/jwt');
const jwtUtil = require('../utils/jwt.util');

const customerRepository = require(
    '../repositories/customer/customer.repository'
);

const loginAccountRepository = require(
    '../repositories/auth/login-account.repository'
);

const accountTypeRepository = require(
    '../repositories/auth/account-type.repository'
);

const upgradeRequestRepository = require(
    '../repositories/auth/account-type-upgrade-request.repository'
);

const customerDatabaseRepository = require(
    '../repositories/customer-database/customer-database.repository'
);

const {
    provisionCustomerDatabase
} = require('./customer-db-provisioning.service');

const {
    getCustomerDatabasePool
} = require('../config/customer-database');

const customerDbUserRepository = require(
    '../repositories/customer-db/user.repository'
);

const register = async (data) => {
    const customerPublicId = crypto.randomUUID();
    const userPublicId = crypto.randomUUID();
    const loginAccountPublicId = crypto.randomUUID();

    const passwordHash = await bcrypt.hash(data.password, 12);

    const connection = await db.getConnection();

    let customerId = null;
    let databaseId = null;
    let defaultAccountType = null;
    let requestedAccountType = null;

    try {
        const existingLoginAccount =
            await loginAccountRepository.getLoginAccountByEmail(
                connection,
                data.email
            );

        if (existingLoginAccount) {
            const error = new Error(
                'Registration cannot be completed with the provided details.'
            );
            error.code = 'ER_DUP_ENTRY';
            throw error;
        }

        defaultAccountType =
            await accountTypeRepository.getByName(
                connection,
                'End User'
            );

        if (!defaultAccountType) {
            throw new Error('Default account type not found.');
        }

        if (data.requestedAccountType) {
            requestedAccountType =
                await accountTypeRepository.getByName(
                    connection,
                    data.requestedAccountType
                );

            if (!requestedAccountType) {
                throw new Error(
                    'Requested account type not found.'
                );
            }
        }

        customerId = await customerRepository.createCustomer(
            connection,
            {
                publicId: customerPublicId,
                name: data.customerName,
                email: data.customerEmail,
                mobile: data.mobile,
                accountTypeId: defaultAccountType.id,
                address: data.address ?? null,
                city: data.city ?? null,
                state: data.state ?? null,
                country: data.country ?? null,
                pincode: data.pincode ?? null
            }
        );
    } finally {
        connection.release();
    }

    try {
        const customerDatabase =
            await provisionCustomerDatabase({
                customerId,
                owner: {
                    publicId: userPublicId,
                    name: data.name,
                    email: data.email,
                    mobile: data.mobile
                }
            });

        databaseId = customerDatabase.databaseId;

        const platformConnection =
            await db.getConnection();

        try {
            await platformConnection.beginTransaction();

            await loginAccountRepository.createLoginAccount(
                platformConnection,
                {
                    publicId: loginAccountPublicId,
                    customerId,
                    userPublicId,
                    email: data.email,
                    passwordHash,
                    status: 1
                }
            );

            if (
                requestedAccountType &&
                requestedAccountType.id !== defaultAccountType.id
            ) {
                await upgradeRequestRepository.createUpgradeRequest(
                    platformConnection,
                    {
                        customerId,
                        currentAccountTypeId: defaultAccountType.id,
                        requestedAccountTypeId:
                            requestedAccountType.id
                    }
                );
            }

            await customerDatabaseRepository.markProvisioningActive(
                platformConnection,
                databaseId
            );

            await platformConnection.commit();
        } catch (error) {
            await platformConnection.rollback();
            throw error;
        } finally {
            platformConnection.release();
        }

        return {
            customerId,
            customerPublicId,
            userPublicId
        };
    } catch (error) {
        if (databaseId) {
            const platformConnection =
                await db.getConnection();

            try {
                await customerDatabaseRepository.markProvisioningFailed(
                    platformConnection,
                    databaseId,
                    error.message
                );
            } finally {
                platformConnection.release();
            }
        }

        throw error;
    }
};

const login = async (data) => {
    const connection = await db.getConnection();

    try {
        const account =
            await loginAccountRepository.getLoginAccountByEmail(
                connection,
                data.email
            );

        if (!account) {
            throw new Error('INVALID_CREDENTIALS');
        }

        if (
            account.login_account_status !== 1 ||
            account.customer_status !== 1 ||
            account.database_status !== 1 ||
            account.provisioning_status !== 'ACTIVE'
        ) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const passwordValid = await bcrypt.compare(
            data.password,
            account.password_hash
        );

        if (!passwordValid) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const customerDbPool =
            getCustomerDatabasePool({
                databaseName: account.database_name,
                host: account.database_host,
                port: account.database_port
            });

        const user =
            await customerDbUserRepository.getUserByPublicId(
                customerDbPool,
                account.user_public_id
            );

        if (!user || user.status !== 1) {
            throw new Error('INVALID_CREDENTIALS');
        }

        await loginAccountRepository.updateLastLogin(
            connection,
            account.id
        );

        const accessToken = jwtUtil.generateToken({
            userPublicId: account.user_public_id,
            customerPublicId: account.customer_public_id
        });

        return {
            accessToken,
            tokenType: 'Bearer',
            expiresIn: jwtExpiresIn
        };
    } finally {
        connection.release();
    }
};

const getCurrentUser = async (
    userPublicId,
    customerPublicId
) => {
    const platformConnection = await db.getConnection();

    try {
        const customer =
            await customerRepository.getCustomerContextByPublicId(
                platformConnection,
                customerPublicId
            );

        if (!customer) {
            const error = new Error('Current user not found.');
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        const [databaseRows] = await platformConnection.execute(
            `
            SELECT
                database_name,
                database_host,
                database_port,
                status,
                provisioning_status
            FROM customer_databases
            WHERE customer_id = ?
            LIMIT 1
            `,
            [customer.id]
        );

        const database = databaseRows[0];

        if (
            !database ||
            database.status !== 1 ||
            database.provisioning_status !== 'ACTIVE'
        ) {
            const error = new Error('Current user not found.');
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        const customerDbPool =
            getCustomerDatabasePool({
                databaseName: database.database_name,
                host: database.database_host,
                port: database.database_port
            });

        const user =
            await customerDbUserRepository.getUserByPublicId(
                customerDbPool,
                userPublicId
            );

        if (!user || user.status !== 1) {
            const error = new Error('Current user not found.');
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        return {
            userPublicId: user.public_id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            userType: user.user_type_code,
            accountType: customer.account_type,
            customer: {
                customerPublicId:
                    customer.customer_public_id,
                name: customer.customer_name,
                email: customer.customer_email
            }
        };
    } finally {
        platformConnection.release();
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};