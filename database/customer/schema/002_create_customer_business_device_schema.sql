-- =========================================================
-- Customer Database - Business & Device Schema
-- =========================================================


-- =========================================================
-- 1. organizations
-- =========================================================

CREATE TABLE IF NOT EXISTS organizations
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    parent_organization_id BIGINT NULL,

    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NULL,
    type VARCHAR(100) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_by_user_id BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_organizations_parent
        FOREIGN KEY (parent_organization_id)
        REFERENCES organizations(id),

    CONSTRAINT fk_organizations_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    INDEX ix_organizations_parent_id (parent_organization_id),
    INDEX ix_organizations_created_by_user_id (created_by_user_id)
);


-- =========================================================
-- 2. locations
-- =========================================================

CREATE TABLE IF NOT EXISTS locations
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    organization_id BIGINT NULL,

    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NULL,

    address VARCHAR(500) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    pincode VARCHAR(20) NULL,

    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_by_user_id BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_locations_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id),

    CONSTRAINT fk_locations_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    INDEX ix_locations_organization_id (organization_id),
    INDEX ix_locations_created_by_user_id (created_by_user_id)
);


-- =========================================================
-- 3. products
-- =========================================================

CREATE TABLE IF NOT EXISTS products
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    name VARCHAR(200) NOT NULL,
    model_number VARCHAR(100) NULL,
    description VARCHAR(1000) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_by_user_id BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    INDEX ix_products_created_by_user_id (created_by_user_id)
);


-- =========================================================
-- 4. devices
-- =========================================================

CREATE TABLE IF NOT EXISTS devices
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    organization_id BIGINT NULL,
    location_id BIGINT NULL,
    product_id BIGINT NOT NULL,

    device_name VARCHAR(150) NULL,
    serial_number VARCHAR(100) NOT NULL,
    model_number VARCHAR(100) NULL,

    mac_address VARCHAR(50) NULL,
    imei_number VARCHAR(50) NULL,
    sim_number VARCHAR(30) NULL,

    activation_key VARCHAR(100) NULL,
    qr_code VARCHAR(255) NULL,

    manufacture_date DATE NULL,
    installation_date DATE NULL,
    warranty_expiry DATE NULL,

    status TINYINT NOT NULL DEFAULT 1,

    remarks TEXT NULL,

    created_by_user_id BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_devices_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id),

    CONSTRAINT fk_devices_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id),

    CONSTRAINT fk_devices_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT fk_devices_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    UNIQUE KEY uq_devices_serial_number (serial_number),

    INDEX ix_devices_organization_id (organization_id),
    INDEX ix_devices_location_id (location_id),
    INDEX ix_devices_product_id (product_id),
    INDEX ix_devices_created_by_user_id (created_by_user_id)
);