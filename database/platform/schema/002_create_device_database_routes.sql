USE GlobalIoTPlatformDB;

CREATE TABLE IF NOT EXISTS device_database_routes
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_code VARCHAR(50) NOT NULL,
    customer_id BIGINT NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_device_routes_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    UNIQUE KEY uq_device_routes_device_code (device_code),
    INDEX ix_device_routes_customer_id (customer_id)
);