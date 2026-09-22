const crypto = require('crypto');
const bcrypt = require('bcrypt');

const db = require('../config/database');

const customerRepository = require('../repositories/customer/customer.repository');
const userRepository = require('../repositories/user/user.repository');
const userTypeRepository = require('../repositories/user/user-type.repository');
const loginAccountRepository = require('../repositories/auth/login-account.repository');
const accountTypeRepository = require('../repositories/auth/account-type.repository');
const upgradeRequestRepository = require('../repositories/auth/account-type-upgrade-request.repository');
const roleRepository = require('../repositories/auth/role.repository');
const rolePermissionRepository = require('../repositories/auth/role-permission.repository');

const register = async (data) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const customerPublicId = crypto.randomUUID();
        const userPublicId = crypto.randomUUID();
        const loginAccountPublicId = crypto.randomUUID();

        const passwordHash = await bcrypt.hash(data.password, 12);

        const accountType = await accountTypeRepository.getByName(
            connection,
            'End User'
        );

        if (!accountType) {
            throw new Error('Default account type not found.');
        }

        const userType = await userTypeRepository.getByName(
            connection,
            'Customer Owner'
        );

        if (!userType) {
            throw new Error('Customer Owner user type not found.');
        }

        const customerId = await customerRepository.createCustomer(
            connection,
            {
                publicId: customerPublicId,
                name: data.customerName,
                email: data.customerEmail,
                mobile: data.mobile,
                address: data.address ?? null,
                city: data.city ?? null,
                state: data.state ?? null,
                country: data.country ?? null,
                pincode: data.pincode ?? null
            }
        );

        const roleId = await roleRepository.createRole(
            connection,
            {
                customerId,
                name: 'Customer Super Admin',
                description: 'Initial administrative role for the customer.'
            }
        );

        await rolePermissionRepository.assignAllActivePermissions(
            connection,
            roleId
        );

        const userId = await userRepository.createUser(
            connection,
            {
                publicId: userPublicId,
                customerId,
                parentUserId: null,
                name: data.name,
                email: data.email,
                mobile: data.mobile,
                userType: userType.id,
                status: 1
            }
        );

        await userRepository.assignRole(
            connection,
            customerId,
            userId,
            roleId,
            null
        );

        await loginAccountRepository.createLoginAccount(
            connection,
            {
                publicId: loginAccountPublicId,
                customerId,
                userId,
                email: data.email,
                passwordHash,
                actualAccountTypeId: accountType.id,
                status: 1
            }
        );

        if (data.requestedAccountType) {
            const requestedAccountType = await accountTypeRepository.getByName(
                connection,
                data.requestedAccountType
            );

            if (!requestedAccountType) {
                throw new Error('Requested account type not found.');
            }

            if (requestedAccountType.id !== accountType.id) {
                await upgradeRequestRepository.createUpgradeRequest(
                    connection,
                    {
                        customerId,
                        currentAccountTypeId: accountType.id,
                        requestedAccountTypeId: requestedAccountType.id
                    }
                );
            }
        }

        await connection.commit();

        return {
            customerId,
            customerPublicId,
            userId,
            userPublicId
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    register
};