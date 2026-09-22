INSERT INTO account_types
(
    name,
    description,
    status
)
VALUES
('End User', 'Default account type assigned after registration.', 1),
('Organization / Company', 'Approved account type for organization or company customers.', 1),
('Business', 'Approved account type for business customers.', 1),
('Individual', 'Approved account type for individual customers.', 1),
('Other', 'Approved account type for other supported customer types.', 1)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    status = VALUES(status);