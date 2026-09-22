CREATE TABLE user_types
(
    id TINYINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(300) NULL,
    status TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE users
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id CHAR(36) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,
    parent_user_id BIGINT NULL,

    name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NULL,
    mobile VARCHAR(30) NULL,

    user_type TINYINT NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_users_parent_user
        FOREIGN KEY (parent_user_id)
        REFERENCES users(id),

    CONSTRAINT fk_users_user_type
        FOREIGN KEY (user_type)
        REFERENCES user_types(id)
);

CREATE INDEX ix_users_customer_id
    ON users(customer_id);

CREATE INDEX ix_users_parent_user_id
    ON users(parent_user_id);

ALTER TABLE customer_login_accounts
    ADD CONSTRAINT fk_customer_login_accounts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id);

CREATE TABLE roles
(
    id INT AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT NOT NULL,

    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_roles_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT uq_roles_customer_name
        UNIQUE (customer_id, name)
);

CREATE INDEX ix_roles_customer_id
    ON roles(customer_id);

CREATE TABLE permissions
(
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NULL,
    module VARCHAR(100) NULL,
    status TINYINT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE role_permissions
(
    role_id INT NOT NULL,
    permission_id INT NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
);

CREATE TABLE user_roles
(
    customer_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,

    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id BIGINT NULL,

    PRIMARY KEY (customer_id, user_id, role_id),

    CONSTRAINT fk_user_roles_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT fk_user_roles_assigned_by
        FOREIGN KEY (assigned_by_user_id)
        REFERENCES users(id)
);

CREATE INDEX ix_user_roles_user_id
    ON user_roles(user_id);

CREATE INDEX ix_user_roles_role_id
    ON user_roles(role_id);

CREATE INDEX ix_user_roles_assigned_by_user_id
    ON user_roles(assigned_by_user_id);