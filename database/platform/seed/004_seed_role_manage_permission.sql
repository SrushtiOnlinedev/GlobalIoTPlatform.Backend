INSERT INTO permissions (code, name, description, status)
SELECT
    'ROLE_MANAGE',
    'Manage Roles',
    'Create and manage customer roles and their permissions.',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM permissions
    WHERE code = 'ROLE_MANAGE'
);