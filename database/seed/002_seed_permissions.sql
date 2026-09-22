INSERT INTO permissions (code, name, description, module, status)
SELECT 'CUSTOMER_MANAGE', 'Manage Customer', 'Manage customer-level information.', 'Customer', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'CUSTOMER_MANAGE');

INSERT INTO permissions (code, name, description, module, status)
SELECT 'USER_MANAGE', 'Manage Users', 'Create and manage customer users.', 'Customer', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'USER_MANAGE');

INSERT INTO permissions (code, name, description, module, status)
SELECT 'ROLE_ASSIGN', 'Assign Roles', 'Assign authorized roles to users.', 'Authorization', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'ROLE_ASSIGN');

INSERT INTO permissions (code, name, description, module, status)
SELECT 'COMPANY_MANAGE', 'Manage Companies', 'Manage companies and company hierarchy.', 'Customer', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'COMPANY_MANAGE');

INSERT INTO permissions (code, name, description, module, status)
SELECT 'PRODUCT_MANAGE', 'Manage Products', 'Create and manage products.', 'Device', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'PRODUCT_MANAGE');

INSERT INTO permissions (code, name, description, module, status)
SELECT 'DEVICE_MANAGE', 'Manage Devices', 'Create and manage devices.', 'Device', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'DEVICE_MANAGE');

INSERT INTO permissions (code, name, description, module, status)
SELECT 'DEVICE_ACCESS_MANAGE', 'Manage Device Access', 'Manage device assignments and access.', 'Device', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'DEVICE_ACCESS_MANAGE');

INSERT INTO permissions (code, name, description, module, status)
SELECT 'DEVICE_DATA_VIEW', 'View Device Data', 'View device information and telemetry.', 'Device', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'DEVICE_DATA_VIEW');

INSERT INTO permissions (code, name, description, module, status)
SELECT 'DEVICE_COMMAND', 'Execute Device Commands', 'Send authorized commands to devices.', 'Device', 1
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'DEVICE_COMMAND');
