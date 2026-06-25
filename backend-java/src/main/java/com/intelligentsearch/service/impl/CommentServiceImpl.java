package com.intelligentsearch.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.Comment;
import com.intelligentsearch.entity.EnterpriseUser;
import com.intelligentsearch.entity.Message;
import com.intelligentsearch.entity.PersonalUser;
import com.intelligentsearch.entity.Post;
import com.intelligentsearch.mapper.CommentMapper;
import com.intelligentsearch.mapper.EnterpriseUserMapper;
import com.intelligentsearch.mapper.MessageMapper;
import com.intelligentsearch.mapper.PersonalUserMapper;
import com.intelligentsearch.mapper.PostMapper;
import com.intelligentsearch.service.CommentService;
import com.intelligentsearch.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentServiceImpl implements CommentService {

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private PostMapper postMapper;

    @Autowired
    private PersonalUserMapper personalUserMapper;

    @Autowired
    private EnterpriseUserMapper enterpriseUserMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Override
    public Result<IPage<Comment>> getComments(Integer postId, Integer page, Integer pageSize) {
        Page<Comment> pageParam = new Page<>(page, pageSize);
        IPage<Comment> result = commentMapper.getCommentsByPostId(pageParam, postId);
        return Result.success(result);
    }

    @Override
    @Transactional
    public Result<Integer> createComment(Integer postId, String content, Integer parentId, Integer replyToId) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.error("未登录");
        }

        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() != 1) {
            return Result.error("帖子不存在");
        }

        String authorName = getAuthorName(userId, userType);

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setAuthorType(userType);
        comment.setAuthorId(userId);
        comment.setAuthorName(authorName);
        comment.setContent(content);
        comment.setParentId(parentId != null ? parentId : 0);
        comment.setReplyToId(replyToId != null ? replyToId : 0);
        comment.setStatus(1);
        comment.setLikeCount(0);

        commentMapper.insert(comment);

        post.setCommentCount(post.getCommentCount() + 1);
        postMapper.updateById(post);

        // 给帖子作者发送评论通知
        if (!post.getAuthorId().equals(userId) || !post.getAuthorType().equals(userType)) {
            Message msg = new Message();
            msg.setUserId(post.getAuthorId());
            msg.setUserType(post.getAuthorType());
            msg.setType("comment");
            msg.setTitle("新评论");
            msg.setContent(authorName + " 评论了你的文章《" + post.getTitle() + "》");
            msg.setRelatedType("post");
            msg.setRelatedId(postId);
            msg.setFromUserId(userId);
            msg.setFromUserName(authorName);
            msg.setIsRead(0);
            messageMapper.insert(msg);
        }

        return Result.success("评论成功", comment.getId());
    }

    @Override
    @Transactional
    public Result<String> deleteComment(Integer id) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.error("未登录");
        }

        Comment comment = commentMapper.selectById(id);
        if (comment == null) {
            return Result.error("评论不存在");
        }

        if (!comment.getAuthorId().equals(userId) || !comment.getAuthorType().equals(userType)) {
            return Result.error("无权限删除");
        }

        comment.setStatus(0);
        commentMapper.updateById(comment);

        Post post = postMapper.selectById(comment.getPostId());
        if (post != null) {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
            postMapper.updateById(post);
        }

        return Result.success("删除成功");
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
}
