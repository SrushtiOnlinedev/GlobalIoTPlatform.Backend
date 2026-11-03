USE GlobalIoTPlatformDB;

CREATE TABLE IF NOT EXISTS device_mqtt_credentials (
    device_code VARCHAR(50) NOT NULL PRIMARY KEY,
    mqtt_host VARCHAR(255) NOT NULL,
    mqtt_port SMALLINT UNSIGNED NOT NULL,
    mqtt_client_id VARCHAR(100) NOT NULL UNIQUE,
    mqtt_username VARCHAR(100) NOT NULL UNIQUE,
    mqtt_topic VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'REVOKED')
        NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_device_mqtt_route
        FOREIGN KEY (device_code)
        REFERENCES device_database_routes(device_code)
        ON DELETE CASCADE
);