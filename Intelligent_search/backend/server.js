const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, pool } = require('./config/db');
const bcrypt = require('bcryptjs');
const authRoutes = require('./routes/auth');
const { router: postsRoutes, initSamplePosts } = require('./routes/posts');
const { router: messagesRoutes, initMessageTable } = require('./routes/messages');
const Post = require('./models/post');
const { Comment } = require('./models/comment');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/messages', messagesRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Intelligent Search Backend is running',
    timestamp: Date.now(),
    version: '1.0.0',
    service: 'intelligent-search'
  });
});

const pagesPath = path.join(__dirname, '..', 'pages');
app.use(express.static(pagesPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(pagesPath, 'login.html'));
});

async function initRootUsers() {
  try {
    const [personalRows] = await pool.execute(
      "SELECT id FROM personal_users WHERE username = 'root'"
    );
    if (personalRows.length === 0) {
      const hashedPassword = await bcrypt.hash('Root@123456', 10);
      await pool.execute(
        "INSERT INTO personal_users (username, password, email, role, status) VALUES (?, ?, ?, 'root', 1)",
        ['root', hashedPassword, 'root@personal.com']
      );
      console.log('个人用户root账户创建成功！用户名: root, 密码: Root@123456');
    } else {
      console.log('个人用户root账户已存在');
    }

    const [companyRows] = await pool.execute(
      "SELECT id FROM companies WHERE company_code = 'ROOT'"
    );
    let companyId;
    if (companyRows.length === 0) {
      const [result] = await pool.execute(
        "INSERT INTO companies (company_name, company_code, contact_name, status) VALUES ('系统管理企业', 'ROOT', '系统管理员', 1)"
      );
      companyId = result.insertId;
      console.log('系统管理企业创建成功');
    } else {
      companyId = companyRows[0].id;
    }

    const [enterpriseRows] = await pool.execute(
      "SELECT id FROM enterprise_users WHERE email = 'root@enterprise.com'"
    );
    if (enterpriseRows.length === 0) {
      const hashedPassword = await bcrypt.hash('Root@123456', 10);
      await pool.execute(
        `INSERT INTO enterprise_users 
         (company_id, employee_id, email, password, real_name, department, position, role, status) 
         VALUES (?, 'ROOT001', ?, ?, '系统管理员', '管理部', '超级管理员', 'root', 1)`,
        [companyId, 'root@enterprise.com', hashedPassword]
      );
      console.log('企业用户root账户创建成功！邮箱: root@enterprise.com, 工号: ROOT001, 密码: Root@123456');
    } else {
      console.log('企业用户root账户已存在');
    }
  } catch (error) {
    console.error('初始化root账户失败:', error.message);
  }
}

async function startServer() {
  await initDatabase();
  await initRootUsers();
  
  try {
    await Post.initTable();
    await Comment.initTable();
    await initMessageTable();
    await initSamplePosts();
  } catch (error) {
    console.error('初始化帖子数据失败:', error.message);
  }

  app.listen(PORT, HOST, () => {
    console.log(`服务器运行在 http://${HOST}:${PORT}`);
    console.log(`健康检查: http://${HOST}:${PORT}/api/health`);
    console.log(`网页端访问: http://${HOST}:${PORT}/`);
    console.log('\n默认root账户:');
    console.log('  个人用户: root / Root@123456');
    console.log('  企业用户: root@enterprise.com / 工号: ROOT001 / 密码: Root@123456');
  });
}

startServer();

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});
