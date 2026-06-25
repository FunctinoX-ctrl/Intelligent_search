const { pool } = require('../config/db');

class Post {
  static async initTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        summary VARCHAR(500),
        cover_image VARCHAR(500),
        author_type ENUM('personal', 'enterprise') NOT NULL,
        author_id INT NOT NULL,
        author_name VARCHAR(100),
        company_id INT,
        view_count INT DEFAULT 0,
        like_count INT DEFAULT 0,
        comment_count INT DEFAULT 0,
        status TINYINT DEFAULT 1,
        is_top TINYINT DEFAULT 0,
        tags VARCHAR(500),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_author (author_type, author_id),
        INDEX idx_company (company_id),
        INDEX idx_created_at (created_at DESC),
        FULLTEXT KEY ft_title_content (title, content)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('posts表创建成功！');
  }

  static async create(data) {
    const {
      title, content, summary = '', cover_image = '',
      author_type, author_id, author_name = '',
      company_id = null, tags = '', category = ''
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO posts (title, content, summary, cover_image, author_type, author_id, author_name, company_id, tags, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, content, summary, cover_image, author_type, author_id, author_name, company_id, tags, category]
    );
    return result.insertId;
  }

  static async getList(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      keyword = '',
      category = '',
      authorType = '',
      companyId = null,
      status = 1
    } = options;

    const offset = (page - 1) * pageSize;
    const whereConditions = [];
    const params = [];

    whereConditions.push('p.status = ?');
    params.push(status);

    if (keyword) {
      whereConditions.push('(p.title LIKE ? OR p.content LIKE ? OR p.summary LIKE ?)');
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    if (category) {
      whereConditions.push('p.category = ?');
      params.push(category);
    }

    if (authorType) {
      whereConditions.push('p.author_type = ?');
      params.push(authorType);
    }

    if (companyId) {
      whereConditions.push('p.company_id = ?');
      params.push(companyId);
    }

    const whereSql = whereConditions.join(' AND ');

    const sql = `SELECT p.id, p.title, p.summary, p.cover_image, p.author_type, p.author_id, 
              p.author_name, p.company_id, p.view_count, p.like_count, 
              p.comment_count, p.is_top, p.tags, p.category, p.created_at
       FROM posts p
       WHERE ${whereSql}
       ORDER BY p.is_top DESC, p.created_at DESC
       LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM posts p WHERE ${whereSql}`;
    const [countResult] = await pool.execute(countSql, params);

    return {
      list: rows,
      total: countResult[0].total,
      page,
      pageSize
    };
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      `SELECT p.* FROM posts p WHERE p.id = ? AND p.status = 1`,
      [id]
    );
    return rows[0];
  }

  static async incrementViewCount(id) {
    await pool.execute('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    await pool.execute(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async delete(id) {
    await pool.execute('UPDATE posts SET status = 0 WHERE id = ?', [id]);
  }

  static async getHotPosts(limit = 10) {
    const sql = `SELECT id, title, summary, cover_image, author_name, view_count, like_count, created_at
       FROM posts WHERE status = 1
       ORDER BY view_count DESC, created_at DESC
       LIMIT ${parseInt(limit)}`;
    const [rows] = await pool.execute(sql);
    return rows;
  }

  static async search(keyword, page = 1, pageSize = 20) {
    return this.getList({ keyword, page, pageSize });
  }
}

module.exports = Post;
