INSERT INTO user_types
(
    id,
    code,
    name,
    description,
    status
)
VALUES
(1, 'CUSTOMER_OWNER', 'Customer Owner', 'The user who initially registers the customer account.', 1),
(2, 'EMPLOYEE', 'Employee', 'A user who works within the customer organization.', 1),
(3, 'SUB_USER', 'Sub User', 'A user created under another customer user with limited scope.', 1),
(4, 'EXTERNAL_USER', 'External User', 'An external user granted authorized access by the customer.', 1)
ON DUPLICATE KEY UPDATE
    code = VALUES(code),
    name = VALUES(name),
    description = VALUES(description),
    status = VALUES(status);