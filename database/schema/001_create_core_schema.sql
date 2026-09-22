CREATE TABLE customers
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    mobile VARCHAR(30) NOT NULL,

    address VARCHAR(500) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    pincode VARCHAR(20) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
        
);

CREATE TABLE account_types
(
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500) NULL,
    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customer_login_accounts
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    actual_account_type_id INT NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,

    email_verified_at DATETIME NULL,
    last_login_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_login_accounts_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_customer_login_accounts_account_type
        FOREIGN KEY (actual_account_type_id)
        REFERENCES account_types(id),

    CONSTRAINT uq_customer_login_accounts_email
        UNIQUE (email)
);

CREATE INDEX ix_customer_login_accounts_customer_id
    ON customer_login_accounts(customer_id);

CREATE INDEX ix_customer_login_accounts_user_id
    ON customer_login_accounts(user_id);

CREATE TABLE account_type_upgrade_requests
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT NOT NULL,

    current_account_type_id INT NOT NULL,
    requested_account_type_id INT NOT NULL,

    status TINYINT NOT NULL DEFAULT 1,

    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    reviewed_by_platform_user_id BIGINT NULL,
    remarks VARCHAR(1000) NULL,

    CONSTRAINT fk_upgrade_requests_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_upgrade_requests_current_type
        FOREIGN KEY (current_account_type_id)
        REFERENCES account_types(id),

    CONSTRAINT fk_upgrade_requests_requested_type
        FOREIGN KEY (requested_account_type_id)
        REFERENCES account_types(id)
);

CREATE INDEX ix_upgrade_requests_customer_id
    ON account_type_upgrade_requests(customer_id);

CREATE INDEX ix_upgrade_requests_status
    ON account_type_upgrade_requests(status);

CREATE INDEX ix_upgrade_requests_requested_type
    ON account_type_upgrade_requests(requested_account_type_id);