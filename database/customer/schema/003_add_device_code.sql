ALTER TABLE devices
    ADD COLUMN device_code VARCHAR(50) NOT NULL AFTER public_id;

ALTER TABLE devices
    ADD CONSTRAINT uq_devices_device_code
    UNIQUE (device_code);