package com.intelligentsearch.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intelligentsearch.entity.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PostMapper extends BaseMapper<Post> {

    @Select("SELECT p.* FROM posts p WHERE p.status = 1 " +
            "AND (#{keyword} = '' OR p.title LIKE CONCAT('%', #{keyword}, '%') OR p.content LIKE CONCAT('%', #{keyword}, '%') OR p.summary LIKE CONCAT('%', #{keyword}, '%')) " +
            "AND (#{category} = '' OR p.category = #{category}) " +
            "ORDER BY p.is_top DESC, p.created_at DESC")
    IPage<Post> getPostList(Page<Post> page,
                            @Param("keyword") String keyword,
                            @Param("category") String category);

    @Select("SELECT p.id, p.title, p.view_count FROM posts p WHERE p.status = 1 ORDER BY p.view_count DESC LIMIT #{limit}")
    List<Post> getHotPosts(@Param("limit") Integer limit);
}
