const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class EnterpriseUser {
  static async findByEmail(email) {
    const [rows] = await pool.execute(`
      SELECT eu.*, c.company_name, c.company_code 
      FROM enterprise_users eu 
      LEFT JOIN companies c ON eu.company_id = c.id 
      WHERE eu.email = ?
    `, [email]);
    return rows[0];
  }

  static async findByEmployeeId(companyId, employeeId) {
    const [rows] = await pool.execute(`
      SELECT eu.*, c.company_name, c.company_code 
      FROM enterprise_users eu 
      LEFT JOIN companies c ON eu.company_id = c.id 
      WHERE eu.company_id = ? AND eu.employee_id = ?
    `, [companyId, employeeId]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT eu.id, eu.company_id, eu.employee_id, eu.email, eu.real_name, 
             eu.department, eu.position, eu.role, eu.status, 
             eu.created_at, eu.updated_at, c.company_name, c.company_code
      FROM enterprise_users eu 
      LEFT JOIN companies c ON eu.company_id = c.id 
      WHERE eu.id = ?
    `, [id]);
    return rows[0];
  }

  static async create(companyId, employeeId, email, password, realName = '', department = '', position = '', role = 'user') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO enterprise_users (company_id, employee_id, email, password, real_name, department, position, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, employeeId, email, hashedPassword, realName, department, position, role]
    );
    return result.insertId;
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updateRole(id, role) {
    await pool.execute('UPDATE enterprise_users SET role = ? WHERE id = ?', [role, id]);
  }

  static async updateStatus(id, status) {
    await pool.execute('UPDATE enterprise_users SET status = ? WHERE id = ?', [status, id]);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM enterprise_users WHERE id = ?', [id]);
  }

  static async listByCompany(companyId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT id, company_id, employee_id, email, real_name, department, position, role, status, created_at 
       FROM enterprise_users 
       WHERE company_id = ? 
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [companyId, pageSize, offset]
    );
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM enterprise_users WHERE company_id = ?',
      [companyId]
    );
    return { list: rows, total: countResult[0].total, page, pageSize };
  }

  static async listAll(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT eu.id, eu.company_id, eu.employee_id, eu.email, eu.real_name, 
              eu.department, eu.position, eu.role, eu.status, eu.created_at,
              c.company_name, c.company_code
       FROM enterprise_users eu
       LEFT JOIN companies c ON eu.company_id = c.id
       ORDER BY eu.id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM enterprise_users');
    return { list: rows, total: countResult[0].total, page, pageSize };
  }
}

class Company {
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM companies WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await pool.execute('SELECT * FROM companies WHERE company_code = ?', [code]);
    return rows[0];
  }

  static async create(companyName, companyCode, contactName = '', contactPhone = '', address = '') {
    const [result] = await pool.execute(
      'INSERT INTO companies (company_name, company_code, contact_name, contact_phone, address) VALUES (?, ?, ?, ?, ?)',
      [companyName, companyCode, contactName, contactPhone, address]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    await pool.execute(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM companies WHERE id = ?', [id]);
  }

  static async list(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      'SELECT * FROM companies ORDER BY id DESC LIMIT ? OFFSET ?',
      [pageSize, offset]
    );
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM companies');
    return { list: rows, total: countResult[0].total, page, pageSize };
  }
}

module.exports = { EnterpriseUser, Company };
