package com.intelligentsearch.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intelligentsearch.entity.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CommentMapper extends BaseMapper<Comment> {

    @Select("SELECT c.* FROM comments c WHERE c.post_id = #{postId} AND c.status = 1 AND c.parent_id = 0 ORDER BY c.created_at DESC")
    IPage<Comment> getCommentsByPostId(Page<Comment> page, @Param("postId") Integer postId);
}
