package com.intelligentsearch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.EnterpriseUser;
import com.intelligentsearch.entity.Message;
import com.intelligentsearch.entity.PersonalUser;
import com.intelligentsearch.entity.Post;
import com.intelligentsearch.entity.PostLike;
import com.intelligentsearch.mapper.EnterpriseUserMapper;
import com.intelligentsearch.mapper.MessageMapper;
import com.intelligentsearch.mapper.PersonalUserMapper;
import com.intelligentsearch.mapper.PostLikeMapper;
import com.intelligentsearch.mapper.PostMapper;
import com.intelligentsearch.service.PostService;
import com.intelligentsearch.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl implements PostService {

    @Autowired
    private PostMapper postMapper;

    @Autowired
    private PostLikeMapper postLikeMapper;

    @Autowired
    private PersonalUserMapper personalUserMapper;

    @Autowired
    private EnterpriseUserMapper enterpriseUserMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Override
    public Result<IPage<Post>> getPostList(Integer page, Integer pageSize, String keyword, String category) {
        Page<Post> pageParam = new Page<>(page, pageSize);
        IPage<Post> result = postMapper.getPostList(pageParam, keyword != null ? keyword : "", category != null ? category : "");
        return Result.success(result);
    }

    /**
     * 智能搜索：将关键词分词后多维度权重匹配 + 相关度排序
     * 分词策略：按空格/逗号分割，同时保留完整词组做精确匹配
     */
    @Override
    public Result<IPage<Post>> smartSearch(Integer page, Integer pageSize, String keyword, String category) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getPostList(page, pageSize, "", category);
        }

        List<String> words = tokenize(keyword);
        Page<Post> pageParam = new Page<>(page, pageSize);
        IPage<Post> result = postMapper.smartSearch(pageParam, words, category != null ? category : "");
        return Result.success(result);
    }

    @Override
    public Result<List<String>> searchSuggestions(String keyword, Integer limit) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Result.success(new ArrayList<>());
        }
        List<String> words = tokenize(keyword);
        List<String> suggestions = postMapper.searchSuggestions(words, limit != null ? limit : 8);
        return Result.success(suggestions);
    }

    /**
     * 分词：空格/逗号/中文无空格时按2字滑窗+完整词组
     */
    private List<String> tokenize(String keyword) {
        List<String> words = new ArrayList<>();
        keyword = keyword.trim();

        // 保留完整关键词做精确匹配
        if (!keyword.isEmpty()) {
            words.add(keyword);
        }

        // 按空格和常见分隔符分词
        String[] parts = keyword.split("[\\s,，、|;；]+");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty() && !words.contains(trimmed)) {
                words.add(trimmed);
            }
        }

        // 对较长的中文片段生成2字滑窗（提升部分匹配率）
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.length() > 2) {
                for (int i = 0; i <= trimmed.length() - 2; i++) {
                    String bigram = trimmed.substring(i, i + 2);
                    if (!words.contains(bigram)) {
                        words.add(bigram);
                    }
                }
            }
        }

        return words.stream().distinct().collect(Collectors.toList());
    }

    @Override
    public Result<List<Post>> getHotPosts(Integer limit) {
        List<Post> posts = postMapper.getHotPosts(limit);
        return Result.success(posts);
    }

    @Override
    public Result<Post> getPostDetail(Integer id) {
        Post post = postMapper.selectById(id);
        if (post == null || post.getStatus() != 1) {
            return Result.error("帖子不存在");
        }
        post.setViewCount(post.getViewCount() + 1);
        postMapper.updateById(post);
        return Result.success(post);
    }

    @Override
    @Transactional
    public Result<Map<String, Object>> createPost(String title, String content, String summary, String coverImage, String tags, String category) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.error("未登录");
        }

        String authorName = getAuthorName(userId, userType);

        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setSummary(summary != null && !summary.isEmpty() ? summary : content.substring(0, Math.min(200, content.length())));
        post.setCoverImage(coverImage);
        post.setAuthorType(userType);
        post.setAuthorId(userId);
        post.setAuthorName(authorName);
        if ("enterprise".equals(userType)) {
            EnterpriseUser user = enterpriseUserMapper.selectById(userId);
            if (user != null) {
                post.setCompanyId(user.getCompanyId());
            }
        }
        post.setViewCount(0);
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setIsTop(0);
        post.setTags(tags);
        post.setCategory(category);
        post.setStatus(1);

        postMapper.insert(post);

        Map<String, Object> result = new HashMap<>();
        result.put("id", post.getId());
        return Result.success("发布成功", result);
    }

    @Override
    public Result<String> updatePost(Integer id, String title, String content, String summary, String coverImage, String tags, String category, Integer status) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();
        String role = getUserRole(userId, userType);

        Post post = postMapper.selectById(id);
        if (post == null) {
            return Result.error("帖子不存在");
        }

        if (!"root".equals(role) && (!post.getAuthorId().equals(userId) || !post.getAuthorType().equals(userType))) {
            return Result.error("无权限修改");
        }

        if (title != null) post.setTitle(title);
        if (content != null) post.setContent(content);
        if (summary != null) post.setSummary(summary);
        if (coverImage != null) post.setCoverImage(coverImage);
        if (tags != null) post.setTags(tags);
        if (category != null) post.setCategory(category);
        if (status != null) post.setStatus(status);

        postMapper.updateById(post);
        return Result.success("更新成功");
    }

    @Override
    public Result<String> deletePost(Integer id) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();
        String role = getUserRole(userId, userType);

        Post post = postMapper.selectById(id);
        if (post == null) {
            return Result.error("帖子不存在");
        }

        if (!"root".equals(role) && (!post.getAuthorId().equals(userId) || !post.getAuthorType().equals(userType))) {
            return Result.error("无权限删除");
        }

        post.setStatus(0);
        postMapper.updateById(post);
        return Result.success("删除成功");
    }

    @Override
    @Transactional
    public Result<Map<String, Object>> toggleLike(Integer postId) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.error("未登录");
        }

        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() != 1) {
            return Result.error("帖子不存在");
        }

        LambdaQueryWrapper<PostLike> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PostLike::getPostId, postId)
                .eq(PostLike::getUserId, userId)
                .eq(PostLike::getUserType, userType);

        PostLike existingLike = postLikeMapper.selectOne(wrapper);
        boolean liked;

        if (existingLike != null) {
            postLikeMapper.deleteById(existingLike.getId());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            liked = false;
        } else {
            PostLike newLike = new PostLike();
            newLike.setPostId(postId);
            newLike.setUserId(userId);
            newLike.setUserType(userType);
            postLikeMapper.insert(newLike);
            post.setLikeCount(post.getLikeCount() + 1);
            liked = true;

            // 给帖子作者发送点赞通知
            if (!post.getAuthorId().equals(userId) || !post.getAuthorType().equals(userType)) {
                Message msg = new Message();
                msg.setUserId(post.getAuthorId());
                msg.setUserType(post.getAuthorType());
                msg.setType("like");
                msg.setTitle("新点赞");
                msg.setContent(getAuthorName(userId, userType) + " 赞了你的文章《" + post.getTitle() + "》");
                msg.setRelatedType("post");
                msg.setRelatedId(postId);
                msg.setFromUserId(userId);
                msg.setFromUserName(getAuthorName(userId, userType));
                msg.setIsRead(0);
                messageMapper.insert(msg);
            }
        }

        postMapper.updateById(post);

        Map<String, Object> result = new HashMap<>();
        result.put("liked", liked);
        result.put("like_count", post.getLikeCount());
        return Result.success(result);
    }

    @Override
    public Result<Map<String, Object>> getLikeStatus(Integer postId) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        Map<String, Object> result = new HashMap<>();
        
        if (userId == null || userType == null) {
            result.put("liked", false);
            return Result.success(result);
        }

        LambdaQueryWrapper<PostLike> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PostLike::getPostId, postId)
                .eq(PostLike::getUserId, userId)
                .eq(PostLike::getUserType, userType);

        PostLike like = postLikeMapper.selectOne(wrapper);

        result.put("liked", like != null);
        return Result.success(result);
    }

    private String getAuthorName(Integer userId, String userType) {
        if ("personal".equals(userType)) {
            PersonalUser user = personalUserMapper.selectById(userId);
            return user != null ? user.getUsername() : "匿名用户";
        } else if ("enterprise".equals(userType)) {
            EnterpriseUser user = enterpriseUserMapper.selectById(userId);
            if (user != null) {
                return user.getRealName() != null ? user.getRealName() : user.getEmployeeId();
            }
        }
        return "匿名用户";
    }

    @Override
    public Result<IPage<Post>> getUserPosts(Integer userId, String userType, Integer page, Integer pageSize, String sort) {
        Page<Post> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Post::getAuthorId, userId)
                .eq(Post::getAuthorType, userType)
                .eq(Post::getStatus, 1);

        if ("hot".equals(sort)) {
            wrapper.orderByDesc(Post::getLikeCount, Post::getViewCount);
        } else {
            wrapper.orderByDesc(Post::getCreatedAt);
        }

        IPage<Post> result = postMapper.selectPage(pageParam, wrapper);
        return Result.success(result);
    }

    private String getUserRole(Integer userId, String userType) {
        if (userId == null || userType == null) return null;
        if ("personal".equals(userType)) {
            PersonalUser user = personalUserMapper.selectById(userId);
            return user != null ? user.getRole() : null;
        } else if ("enterprise".equals(userType)) {
            EnterpriseUser user = enterpriseUserMapper.selectById(userId);
            return user != null ? user.getRole() : null;
        }
        return null;
    }
}
