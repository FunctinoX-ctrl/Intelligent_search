const { pool } = require('../config/db');

class Comment {
  static async initTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        author_type ENUM('personal', 'enterprise') NOT NULL,
        author_id INT NOT NULL,
        author_name VARCHAR(100),
        content TEXT NOT NULL,
        parent_id INT DEFAULT 0,
        reply_to_id INT DEFAULT 0,
        status TINYINT DEFAULT 1,
        like_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_post_id (post_id),
        INDEX idx_author (author_type, author_id),
        INDEX idx_parent (parent_id),
        INDEX idx_created_at (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('comments表创建成功！');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_type ENUM('personal', 'enterprise') NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_post_user (post_id, user_type, user_id),
        INDEX idx_post_id (post_id),
        INDEX idx_user (user_type, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('post_likes表创建成功！');
  }

  static async getListByPostId(postId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const sql = `SELECT c.* FROM comments c 
      WHERE c.post_id = ? AND c.status = 1 AND c.parent_id = 0
      ORDER BY c.created_at DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(sql, [postId]);
    
    const countSql = `SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND status = 1 AND parent_id = 0`;
    const [countResult] = await pool.execute(countSql, [postId]);
    
    return {
      list: rows,
      total: countResult[0].total,
      page,
      pageSize
    };
  }

  static async create(data) {
    const { post_id, author_type, author_id, author_name = '', content, parent_id = 0, reply_to_id = 0 } = data;
    
    const [result] = await pool.execute(
      `INSERT INTO comments (post_id, author_type, author_id, author_name, content, parent_id, reply_to_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [post_id, author_type, author_id, author_name, content, parent_id, reply_to_id]
    );
    
    await pool.execute('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [post_id]);
    
    return result.insertId;
  }

  static async delete(id, userId, userType) {
    const [rows] = await pool.execute('SELECT * FROM comments WHERE id = ?', [id]);
    if (!rows[0]) return false;
    
    if (rows[0].author_id !== userId || rows[0].author_type !== userType) {
      return false;
    }
    
    await pool.execute('UPDATE comments SET status = 0 WHERE id = ?', [id]);
    await pool.execute('UPDATE posts SET comment_count = comment_count - 1 WHERE id = ?', [rows[0].post_id]);
    
    return true;
  }
}

class Like {
  static async checkLiked(postId, userId, userType) {
    const [rows] = await pool.execute(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ? AND user_type = ?',
      [postId, userId, userType]
    );
    return rows.length > 0;
  }

  static async toggle(postId, userId, userType) {
    const isLiked = await this.checkLiked(postId, userId, userType);
    
    if (isLiked) {
      await pool.execute(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ? AND user_type = ?',
        [postId, userId, userType]
      );
      await pool.execute('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [postId]);
      return { liked: false };
    } else {
      await pool.execute(
        'INSERT INTO post_likes (post_id, user_id, user_type) VALUES (?, ?, ?)',
        [postId, userId, userType]
      );
      await pool.execute('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [postId]);
      return { liked: true };
    }
  }
}

module.exports = { Comment, Like };
