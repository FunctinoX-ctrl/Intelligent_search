const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = 'intelligent_search_secret_key_2026';
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function getCurrentUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  if (decoded.userType === 'personal') {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, status FROM personal_users WHERE id = ?',
      [decoded.userId]
    );
    if (rows[0]) {
      return { ...rows[0], userType: 'personal' };
    }
  } else if (decoded.userType === 'enterprise') {
    const [rows] = await pool.execute(`
      SELECT eu.id, eu.company_id, eu.employee_id, eu.email, eu.real_name, 
             eu.department, eu.position, eu.role, eu.status,
             c.company_name, c.company_code
      FROM enterprise_users eu
      LEFT JOIN companies c ON eu.company_id = c.id
      WHERE eu.id = ?
    `, [decoded.userId]);
    if (rows[0]) {
      return { ...rows[0], userType: 'enterprise' };
    }
  }
  return null;
}

async function authMiddleware(req, res, next) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  req.user = user;
  next();
}

// 初始化消息表
async function initMessageTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_type ENUM('personal', 'enterprise') NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'system',
        title VARCHAR(200) DEFAULT '',
        content TEXT,
        related_type VARCHAR(50) DEFAULT '',
        related_id INT DEFAULT 0,
        from_user_id INT DEFAULT 0,
        from_user_name VARCHAR(100) DEFAULT '',
        is_read TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id, user_type),
        INDEX idx_user_read (user_id, user_type, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('messages表创建成功！');
  } catch (error) {
    console.error('messages表创建失败:', error.message);
  }
}

// 获取消息列表
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const userId = req.user.id;
    const userType = req.user.userType;

    let whereSql = 'WHERE user_id = ? AND user_type = ?';
    const params = [userId, userType];

    if (type && type !== 'all') {
      whereSql += ' AND type = ?';
      params.push(type);
    }

    const countSql = `SELECT COUNT(*) as total FROM messages ${whereSql}`;
    const [countResult] = await pool.execute(countSql, params);
    const total = countResult[0].total;

    const listSql = `SELECT * FROM messages ${whereSql} ORDER BY created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(listSql, params);

    res.json({
      success: true,
      data: { list: rows, total, page: parseInt(page), pageSize: parseInt(pageSize) }
    });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取未读消息数
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND user_type = ? AND is_read = 0',
      [req.user.id, req.user.userType]
    );
    res.json({ success: true, data: rows[0].count });
  } catch (error) {
    console.error('获取未读数错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 标记单条已读
router.post('/read/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM messages WHERE id = ? AND user_id = ? AND user_type = ?',
      [id, req.user.id, req.user.userType]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, message: '消息不存在' });
    }
    await pool.execute('UPDATE messages SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 标记全部已读
router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE messages SET is_read = 1 WHERE user_id = ? AND user_type = ? AND is_read = 0',
      [req.user.id, req.user.userType]
    );
    res.json({ success: true, message: '全部已读' });
  } catch (error) {
    console.error('全部已读错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = { router, initMessageTable };