INSERT INTO user_types
(
    id,
    name,
    description,
    status
)
VALUES
(1, 'Customer Owner', 'The user who initially registers the customer account.', 1),
(2, 'Employee', 'A user who works within the customer organization.', 1),
(3, 'Sub User', 'A user created under another customer user with limited scope.', 1),
(4, 'External User', 'An external user granted authorized access by the customer.', 1)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    status = VALUES(status);