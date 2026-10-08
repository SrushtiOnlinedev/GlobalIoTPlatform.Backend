-- =========================================================
-- Platform Database - Schema
-- =========================================================
CREATE DATABASE IF NOT EXISTS GlobalIoTPlatformDB;

USE GlobalIoTPlatformDB;


-- =========================================================
-- 1. account_types
-- =========================================================

CREATE TABLE IF NOT EXISTS account_types
(
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. customers
-- =========================================================

CREATE TABLE IF NOT EXISTS customers
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    mobile VARCHAR(30) NOT NULL,

    account_type_id INT NOT NULL,

    address VARCHAR(500) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    pincode VARCHAR(20) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_account_type
        FOREIGN KEY (account_type_id)
        REFERENCES account_types(id),

    INDEX ix_customers_email (email),
    INDEX ix_customers_account_type_id (account_type_id)
);


-- =========================================================
-- 3. platform_users
-- =========================================================

CREATE TABLE IF NOT EXISTS platform_users
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    mobile VARCHAR(30) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_platform_users_email (email)
);


-- =========================================================
-- 4. platform_login_accounts
-- =========================================================

CREATE TABLE IF NOT EXISTS platform_login_accounts
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    platform_user_id BIGINT NOT NULL,

    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    status TINYINT NOT NULL DEFAULT 1,

    email_verified_at DATETIME NULL,
    last_login_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_platform_login_user
        FOREIGN KEY (platform_user_id)
        REFERENCES platform_users(id),

    UNIQUE KEY uq_platform_login_user (platform_user_id),
    UNIQUE KEY uq_platform_login_email (email)
);


-- =========================================================
-- 5. platform_roles
-- =========================================================

CREATE TABLE IF NOT EXISTS platform_roles
(
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 6. platform_user_roles
-- =========================================================

CREATE TABLE IF NOT EXISTS platform_user_roles
(
    platform_user_id BIGINT NOT NULL,
    platform_role_id INT NOT NULL,

    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by_platform_user_id BIGINT NULL,

    PRIMARY KEY (platform_user_id, platform_role_id),

    CONSTRAINT fk_platform_user_roles_user
        FOREIGN KEY (platform_user_id)
        REFERENCES platform_users(id),

    CONSTRAINT fk_platform_user_roles_role
        FOREIGN KEY (platform_role_id)
        REFERENCES platform_roles(id),

    CONSTRAINT fk_platform_user_roles_assigned_by
        FOREIGN KEY (assigned_by_platform_user_id)
        REFERENCES platform_users(id)
);


-- =========================================================
-- 7. account_type_upgrade_requests
-- =========================================================

CREATE TABLE IF NOT EXISTS account_type_upgrade_requests
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT NOT NULL,
    current_account_type_id INT NOT NULL,
    requested_account_type_id INT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,

    reviewed_by_platform_user_id BIGINT NULL,

    remarks VARCHAR(1000) NULL,

    CONSTRAINT fk_upgrade_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_upgrade_current_type
        FOREIGN KEY (current_account_type_id)
        REFERENCES account_types(id),

    CONSTRAINT fk_upgrade_requested_type
        FOREIGN KEY (requested_account_type_id)
        REFERENCES account_types(id),

    CONSTRAINT fk_upgrade_reviewed_by
        FOREIGN KEY (reviewed_by_platform_user_id)
        REFERENCES platform_users(id),

    CONSTRAINT chk_upgrade_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),

    CONSTRAINT chk_upgrade_different_type
        CHECK (current_account_type_id <> requested_account_type_id),

    INDEX ix_upgrade_customer_id (customer_id),
    INDEX ix_upgrade_status (status)
);


-- =========================================================
-- 8. user_types
-- =========================================================

CREATE TABLE IF NOT EXISTS user_types
(
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 9. permissions
-- =========================================================

CREATE TABLE IF NOT EXISTS permissions
(
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 10. customer_login_accounts
-- =========================================================

CREATE TABLE IF NOT EXISTS customer_login_accounts
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,
    user_public_id CHAR(36) NOT NULL,

    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    status TINYINT NOT NULL DEFAULT 1,

    email_verified_at DATETIME NULL,
    last_login_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_login_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    UNIQUE KEY uq_customer_login_user
        (customer_id, user_public_id),

    UNIQUE KEY uq_customer_login_email (email)
);


-- =========================================================
-- 11. customer_databases
-- =========================================================

CREATE TABLE IF NOT EXISTS customer_databases
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,

    database_name VARCHAR(200) NOT NULL,
    database_host VARCHAR(255) NOT NULL,
    database_port INT NOT NULL,

    status TINYINT NOT NULL DEFAULT 0,

    provisioning_status VARCHAR(30) NOT NULL DEFAULT 'PROVISIONING',
    provisioning_attempts INT NOT NULL DEFAULT 0,

    provisioning_started_at DATETIME NULL,
    provisioning_completed_at DATETIME NULL,
    provisioning_failed_at DATETIME NULL,

    provisioning_error VARCHAR(2000) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_customer_db_provisioning_status
        CHECK (provisioning_status IN ('PROVISIONING', 'ACTIVE', 'FAILED')),

    CONSTRAINT fk_customer_databases_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    UNIQUE KEY uq_customer_database_customer (customer_id),
    UNIQUE KEY uq_customer_database_name (database_name),

    INDEX ix_customer_databases_status (status),
    INDEX ix_customer_databases_provisioning_status
        (provisioning_status)
);