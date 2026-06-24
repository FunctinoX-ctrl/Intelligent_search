const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class PersonalUser {
  static async findByUsername(username) {
    const [rows] = await pool.execute('SELECT * FROM personal_users WHERE username = ?', [username]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, status, created_at, updated_at FROM personal_users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async create(username, password, email = '', role = 'user') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO personal_users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, role]
    );
    return result.insertId;
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updateRole(id, role) {
    await pool.execute('UPDATE personal_users SET role = ? WHERE id = ?', [role, id]);
  }

  static async updateStatus(id, status) {
    await pool.execute('UPDATE personal_users SET status = ? WHERE id = ?', [status, id]);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM personal_users WHERE id = ?', [id]);
  }

  static async list(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, status, created_at FROM personal_users ORDER BY id DESC LIMIT ? OFFSET ?',
      [pageSize, offset]
    );
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM personal_users');
    return { list: rows, total: countResult[0].total, page, pageSize };
  }
}

module.exports = PersonalUser;
