package com.intelligentsearch.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.Comment;

public interface CommentService {
    Result<IPage<Comment>> getComments(Integer postId, Integer page, Integer pageSize);
    Result<Integer> createComment(Integer postId, String content, Integer parentId, Integer replyToId);
    Result<String> deleteComment(Integer id);
}
