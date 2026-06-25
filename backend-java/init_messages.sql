USE intelligent_search;

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    title VARCHAR(200) NOT NULL,
    content TEXT,
    related_type VARCHAR(50),
    related_id INT,
    from_user_id INT,
    from_user_name VARCHAR(100),
    is_read INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id, user_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS view_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    post_id INT NOT NULL,
    post_title VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_post (user_id, user_type, post_id),
    INDEX idx_user_time (user_id, user_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO messages (user_id, user_type, type, title, content, is_read) VALUES
(1, 'personal', 'system', '欢迎使用智能搜索平台', '欢迎您加入我们的平台，祝您使用愉快！', 0),
(1, 'personal', 'system', '系统公告', '平台功能持续优化中，如有问题请联系管理员。', 1)
ON DUPLICATE KEY UPDATE id=id;
