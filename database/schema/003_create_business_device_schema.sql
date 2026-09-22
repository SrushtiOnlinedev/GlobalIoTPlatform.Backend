-- 1. Companies
CREATE TABLE companies
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,

    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_by_user_id BIGINT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_companies_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_companies_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
);

CREATE INDEX ix_companies_customer_id
    ON companies(customer_id);

CREATE INDEX ix_companies_created_by_user_id
    ON companies(created_by_user_id);


-- 2. Products
CREATE TABLE products
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,

    name VARCHAR(200) NOT NULL,
    model_number VARCHAR(100) NULL,
    description VARCHAR(1000) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_by_user_id BIGINT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_products_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
);

CREATE INDEX ix_products_customer_id
    ON products(customer_id);

CREATE INDEX ix_products_created_by_user_id
    ON products(created_by_user_id);


-- 3. Devices
CREATE TABLE devices
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,
    company_id BIGINT NULL,
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

    created_by_user_id BIGINT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_devices_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_devices_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id),

    CONSTRAINT fk_devices_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT fk_devices_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    CONSTRAINT uq_devices_serial_number
        UNIQUE (serial_number)
);

CREATE INDEX ix_devices_customer_id
    ON devices(customer_id);

CREATE INDEX ix_devices_company_id
    ON devices(company_id);

CREATE INDEX ix_devices_product_id
    ON devices(product_id);

CREATE INDEX ix_devices_created_by_user_id
    ON devices(created_by_user_id);