-- =========================================================
-- Customer Database - Core Schema
-- =========================================================


-- =========================================================
-- 1. users
-- =========================================================

CREATE TABLE IF NOT EXISTS users
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    parent_user_id BIGINT NULL,

    name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    mobile VARCHAR(30) NULL,

    user_type_code VARCHAR(50) NOT NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_parent
        FOREIGN KEY (parent_user_id)
        REFERENCES users(id),

    UNIQUE KEY uq_users_email (email),

    INDEX ix_users_parent_user_id (parent_user_id),
    INDEX ix_users_user_type_code (user_type_code)
);


-- =========================================================
-- 2. roles
-- =========================================================

CREATE TABLE IF NOT EXISTS roles
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,

    status TINYINT NOT NULL DEFAULT 1,

    created_by_user_id BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_roles_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id),

    UNIQUE KEY uq_roles_name (name),
    INDEX ix_roles_created_by_user_id (created_by_user_id)
);


-- =========================================================
-- 3. role_permissions
-- =========================================================

CREATE TABLE IF NOT EXISTS role_permissions
(
    role_id BIGINT NOT NULL,
    permission_code VARCHAR(100) NOT NULL,

    PRIMARY KEY (role_id, permission_code),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 4. user_roles
-- =========================================================

CREATE TABLE IF NOT EXISTS user_roles
(
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,

    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id BIGINT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_roles_assigned_by
        FOREIGN KEY (assigned_by_user_id)
        REFERENCES users(id)
);