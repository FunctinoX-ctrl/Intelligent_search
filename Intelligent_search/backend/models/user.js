const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async findByUsername(username) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(username, password, email = '') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );
    return result.insertId;
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;
