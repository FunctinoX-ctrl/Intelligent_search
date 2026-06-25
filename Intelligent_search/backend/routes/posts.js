const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const { Comment, Like } = require('../models/comment');

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

  const { pool } = require('../config/db');

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

async function initSamplePosts() {
  try {
    const { pool } = require('../config/db');
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM posts WHERE status = 1');
    if (countResult[0].total > 0) {
      console.log('示例帖子已存在，跳过初始化');
      return;
    }

    const samplePosts = [
      {
        title: '智能搜索技术发展趋势与应用前景',
        content: '随着人工智能技术的快速发展，智能搜索已经成为信息检索领域的重要方向。本文将从技术原理、应用场景、发展趋势等多个维度，深入探讨智能搜索的现状与未来。智能搜索不仅能够理解用户的自然语言查询，还能根据上下文和用户意图提供精准的搜索结果。',
        summary: '深入探讨智能搜索技术的发展现状、核心技术以及未来应用前景...',
        author_type: 'personal',
        author_id: 1,
        author_name: '系统管理员',
        tags: '智能搜索,AI,技术趋势',
        category: '技术'
      },
      {
        title: '企业数字化转型中的信息检索解决方案',
        content: '在数字化转型的浪潮中，企业面临着海量数据的管理和检索挑战。本文介绍了几种主流的企业级搜索解决方案，包括Elasticsearch、Solr等开源框架，以及基于云服务的搜索解决方案。通过合理的架构设计和技术选型，企业可以构建高效、稳定、安全的内部知识检索系统。',
        summary: '企业数字化转型背景下，如何构建高效的企业级信息检索系统...',
        author_type: 'enterprise',
        author_id: 1,
        author_name: '系统管理企业',
        company_id: 1,
        tags: '企业数字化,信息检索,解决方案',
        category: '企业'
      },
      {
        title: '自然语言处理在搜索引擎中的应用实践',
        content: '自然语言处理（NLP）是智能搜索的核心技术之一。本文详细介绍了分词、词性标注、命名实体识别、语义理解等NLP技术在搜索引擎中的具体应用。通过这些技术，搜索引擎能够更好地理解用户的查询意图，返回更加相关的搜索结果。',
        summary: 'NLP技术如何赋能智能搜索，提升搜索结果的相关性和准确性...',
        author_type: 'personal',
        author_id: 1,
        author_name: '系统管理员',
        tags: 'NLP,自然语言处理,搜索引擎',
        category: '技术'
      },
      {
        title: '推荐系统与搜索技术的融合创新',
        content: '推荐系统和搜索技术在互联网产品中扮演着重要角色。本文探讨了推荐系统与搜索技术的融合路径，包括搜索结果个性化排序、基于搜索行为的推荐优化、以及"搜索即推荐"的新型交互模式。两者的结合能够为用户提供更加智能、精准的信息服务。',
        summary: '搜索与推荐的技术融合，打造更智能的信息发现体验...',
        author_type: 'personal',
        author_id: 1,
        author_name: '系统管理员',
        tags: '推荐系统,搜索技术,个性化',
        category: '技术'
      },
      {
        title: '知识图谱在企业搜索中的应用价值',
        content: '知识图谱技术为企业搜索带来了新的可能性。通过构建企业知识图谱，可以实现实体级别的搜索、关联关系发现、智能问答等高级功能。本文结合实际案例，介绍了企业知识图谱的构建方法和应用场景。',
        summary: '知识图谱如何提升企业搜索的智能化水平和信息价值...',
        author_type: 'enterprise',
        author_id: 1,
        author_name: '系统管理企业',
        company_id: 1,
        tags: '知识图谱,企业搜索,智能问答',
        category: '企业'
      },
      {
        title: '移动端搜索体验优化最佳实践',
        content: '移动端已成为用户搜索的主要入口。本文从界面设计、交互方式、性能优化三个方面，分享了移动端搜索体验优化的最佳实践。包括搜索框设计、联想词优化、搜索结果展示、语音搜索等功能的设计要点。',
        summary: '移动端搜索用户体验设计与优化的实用技巧...',
        author_type: 'personal',
        author_id: 1,
        author_name: '系统管理员',
        tags: '移动端,用户体验,搜索优化',
        category: '设计'
      },
      {
        title: '搜索结果排序算法深度解析',
        content: '搜索结果排序是搜索引擎的核心技术。本文深入解析了经典排序算法和现代机器学习排序算法，包括TF-IDF、BM25、Learning to Rank等。同时还介绍了排序评估指标和A/B测试方法。',
        summary: '从经典算法到机器学习，全面解析搜索排序技术...',
        author_type: 'personal',
        author_id: 1,
        author_name: '系统管理员',
        tags: '排序算法,机器学习,搜索技术',
        category: '技术'
      },
      {
        title: '企业知识库建设与智能检索',
        content: '企业知识库是企业知识管理的重要载体。本文介绍了企业知识库的建设方法论，包括知识采集、知识组织、知识标注等环节，并重点讨论了如何利用智能检索技术提升知识库的使用效率。',
        summary: '构建企业知识库，实现知识的高效管理与智能检索...',
        author_type: 'enterprise',
        author_id: 1,
        author_name: '系统管理企业',
        company_id: 1,
        tags: '知识库,知识管理,企业管理',
        category: '企业'
      }
    ];

    for (const post of samplePosts) {
      await Post.create(post);
    }
    console.log(`初始化 ${samplePosts.length} 篇示例帖子成功！`);
  } catch (error) {
    console.error('初始化示例帖子失败:', error.message);
  }
}

router.get('/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', category = '', authorType = '', companyId = null } = req.query;
    
    const result = await Post.getList({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      category,
      authorType,
      companyId: companyId ? parseInt(companyId) : null
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { keyword = '', page = 1, pageSize = 10 } = req.query;
    
    if (!keyword.trim()) {
      return res.json({ success: true, data: { list: [], total: 0, page: parseInt(page), pageSize: parseInt(pageSize) } });
    }

    const result = await Post.search(keyword, parseInt(page), parseInt(pageSize));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('搜索帖子错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/hot', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = await Post.getHotPosts(parseInt(limit));
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('获取热门帖子错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.getById(id);
    
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    await Post.incrementViewCount(id);
    post.view_count = (post.view_count || 0) + 1;

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { title, content, summary = '', cover_image = '', tags = '', category = '' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }

    const authorName = req.user.userType === 'personal' 
      ? req.user.username 
      : (req.user.real_name || req.user.employee_id);

    const postId = await Post.create({
      title,
      content,
      summary: summary || content.substring(0, 200),
      cover_image,
      author_type: req.user.userType,
      author_id: req.user.id,
      author_name: authorName,
      company_id: req.user.company_id || null,
      tags,
      category
    });

    res.json({ success: true, message: '发布成功', data: { id: postId } });
  } catch (error) {
    console.error('创建帖子错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, cover_image, tags, category, status } = req.body;
    
    const post = await Post.getById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    if (post.author_id !== req.user.id && post.author_type !== req.user.userType && req.user.role !== 'root') {
      return res.status(403).json({ success: false, message: '无权限修改' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;

    await Post.update(id, updateData);
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新帖子错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.getById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    if (post.author_id !== req.user.id && post.author_type !== req.user.userType && req.user.role !== 'root') {
      return res.status(403).json({ success: false, message: '无权限删除' });
    }

    await Post.delete(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await Comment.getListByPostId(
      parseInt(id), 
      parseInt(page), 
      parseInt(pageSize)
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id = 0, reply_to_id = 0 } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const post = await Post.getById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    const authorName = req.user.userType === 'personal' 
      ? req.user.username 
      : (req.user.real_name || req.user.employee_id);

    const commentId = await Comment.create({
      post_id: parseInt(id),
      author_type: req.user.userType,
      author_id: req.user.id,
      author_name: authorName,
      content: content.trim(),
      parent_id: parseInt(parent_id) || 0,
      reply_to_id: parseInt(reply_to_id) || 0
    });

    res.json({ success: true, message: '评论成功', data: { id: commentId } });
  } catch (error) {
    console.error('发表评论错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/comments/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Comment.delete(parseInt(id), req.user.id, req.user.userType);
    
    if (!result) {
      return res.status(403).json({ success: false, message: '无权限删除或评论不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.getById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    const result = await Like.toggle(parseInt(id), req.user.id, req.user.userType);
    
    const updatedPost = await Post.getById(id);
    
    res.json({ 
      success: true, 
      data: { 
        liked: result.liked,
        like_count: updatedPost.like_count
      } 
    });
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/like/status', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return res.json({ success: true, data: { liked: false } });
    }
    const isLiked = await Like.checkLiked(parseInt(id), user.id, user.userType);
    res.json({ success: true, data: { liked: isLiked } });
  } catch (error) {
    console.error('检查点赞状态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = { router, initSamplePosts };
