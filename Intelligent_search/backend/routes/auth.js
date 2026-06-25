const express = require('express');
const router = express.Router();
const PersonalUser = require('../models/personalUser');
const { EnterpriseUser, Company } = require('../models/enterpriseUser');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'intelligent_search_secret_key_2026';

function generateToken(userId, userType, role) {
  return jwt.sign(
    { userId, userType, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function getCurrentUser(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  if (decoded.userType === 'personal') {
    const user = await PersonalUser.findById(decoded.userId);
    if (user) {
      return { ...user, userType: 'personal' };
    }
  } else if (decoded.userType === 'enterprise') {
    const user = await EnterpriseUser.findById(decoded.userId);
    if (user) {
      return { ...user, userType: 'enterprise' };
    }
  }
  return null;
}

router.post('/personal/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    const user = await PersonalUser.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    const isPasswordValid = await PersonalUser.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const token = generateToken(user.id, 'personal', user.role);

    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      userType: 'personal',
      created_at: user.created_at
    };

    res.json({
      success: true,
      message: '登录成功',
      data: { user: userInfo, token }
    });
  } catch (error) {
    console.error('个人用户登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/personal/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度不能少于6位'
      });
    }

    const existingUser = await PersonalUser.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    const userId = await PersonalUser.create(username, password, email || '', 'user');
    const user = await PersonalUser.findById(userId);

    res.json({
      success: true,
      message: '注册成功',
      data: { user: { ...user, userType: 'personal' } }
    });
  } catch (error) {
    console.error('个人用户注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/enterprise/login', async (req, res) => {
  try {
    const { email, employeeId, password } = req.body;

    if (!email || !employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱、员工工号和密码不能为空'
      });
    }

    const userByEmail = await EnterpriseUser.findByEmail(email);
    if (!userByEmail) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    if (userByEmail.employee_id !== employeeId) {
      return res.status(401).json({
        success: false,
        message: '员工工号不匹配'
      });
    }

    if (userByEmail.status !== 1) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    const isPasswordValid = await EnterpriseUser.comparePassword(password, userByEmail.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }

    const token = generateToken(userByEmail.id, 'enterprise', userByEmail.role);

    const userInfo = {
      id: userByEmail.id,
      company_id: userByEmail.company_id,
      company_name: userByEmail.company_name,
      company_code: userByEmail.company_code,
      employee_id: userByEmail.employee_id,
      email: userByEmail.email,
      real_name: userByEmail.real_name,
      department: userByEmail.department,
      position: userByEmail.position,
      role: userByEmail.role,
      userType: 'enterprise',
      created_at: userByEmail.created_at
    };

    res.json({
      success: true,
      message: '登录成功',
      data: { user: userInfo, token }
    });
  } catch (error) {
    console.error('企业用户登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/enterprise/register', async (req, res) => {
  try {
    const { companyName, companyCode, contactName, contactPhone, address,
            employeeId, email, password, realName, department, position } = req.body;

    if (!companyName || !companyCode || !employeeId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '企业名称、企业编码、员工工号、邮箱和密码不能为空'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度不能少于6位'
      });
    }

    const existingCompany = await Company.findByCode(companyCode);
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: '企业编码已存在'
      });
    }

    const existingUser = await EnterpriseUser.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    const companyId = await Company.create(
      companyName, companyCode,
      contactName || '', contactPhone || '', address || ''
    );

    const userId = await EnterpriseUser.create(
      companyId, employeeId, email, password,
      realName || '', department || '', position || '', 'admin'
    );

    const user = await EnterpriseUser.findById(userId);

    res.json({
      success: true,
      message: '企业注册成功',
      data: { user: { ...user, userType: 'enterprise' } }
    });
  } catch (error) {
    console.error('企业注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const user = await getCurrentUser(token);
    if (!user) {
      return res.status(401).json({ success: false, message: '登录已过期' });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '退出成功' });
});

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  const user = await getCurrentUser(token);
  if (!user) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }

  req.user = user;
  next();
}

async function rootAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  const user = await getCurrentUser(token);
  if (!user || user.role !== 'root') {
    return res.status(403).json({ success: false, message: '需要root权限' });
  }

  req.user = user;
  next();
}

router.get('/admin/personal-users', rootAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await PersonalUser.list(parseInt(page), parseInt(pageSize));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取个人用户列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/admin/personal-users/:id/role', rootAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['root', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: '无效的角色' });
    }
    await PersonalUser.updateRole(id, role);
    res.json({ success: true, message: '角色更新成功' });
  } catch (error) {
    console.error('更新个人用户角色错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/admin/personal-users/:id/status', rootAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await PersonalUser.updateStatus(id, status);
    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('更新个人用户状态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/admin/personal-users/:id', rootAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await PersonalUser.delete(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除个人用户错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/admin/enterprise-users', rootAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await EnterpriseUser.listAll(parseInt(page), parseInt(pageSize));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取企业用户列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/admin/enterprise-users/:id/role', rootAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['root', 'admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: '无效的角色' });
    }
    await EnterpriseUser.updateRole(id, role);
    res.json({ success: true, message: '角色更新成功' });
  } catch (error) {
    console.error('更新企业用户角色错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/admin/enterprise-users/:id/status', rootAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await EnterpriseUser.updateStatus(id, status);
    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('更新企业用户状态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/admin/enterprise-users/:id', rootAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await EnterpriseUser.delete(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除企业用户错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/admin/companies', rootAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await Company.list(parseInt(page), parseInt(pageSize));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取企业列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/admin/companies', rootAuthMiddleware, async (req, res) => {
  try {
    const { companyName, companyCode, contactName, contactPhone, address } = req.body;
    if (!companyName || !companyCode) {
      return res.status(400).json({ success: false, message: '企业名称和编码不能为空' });
    }
    const id = await Company.create(companyName, companyCode, contactName || '', contactPhone || '', address || '');
    res.json({ success: true, message: '创建成功', data: { id } });
  } catch (error) {
    console.error('创建企业错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/admin/companies/:id', rootAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, contactName, contactPhone, address, status } = req.body;
    const updateData = {};
    if (companyName !== undefined) updateData.company_name = companyName;
    if (contactName !== undefined) updateData.contact_name = contactName;
    if (contactPhone !== undefined) updateData.contact_phone = contactPhone;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = status;

    await Company.update(id, updateData);
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新企业错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/admin/companies/:id', rootAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Company.delete(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除企业错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
