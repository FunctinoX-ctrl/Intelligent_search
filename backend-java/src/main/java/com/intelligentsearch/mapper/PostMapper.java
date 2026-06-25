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

    /**
     * 智能搜索：分词匹配 + 多字段权重排序 + 标签搜索 + 相关度排序
     * 权重规则：
     *   标题完全匹配 +10, 标题分词匹配 +6, 标签完全匹配 +8, 标签分词匹配 +4,
     *   摘要分词匹配 +3, 内容分词匹配 +1
     *   浏览量/点赞量作为热度微调
     */
    @Select("<script>" +
            "SELECT p.*, (" +
            "  0" +
            "  <foreach collection='words' item='w' separator='+'>" +
            "    + IF(p.title = #{w}, 10, IF(p.title LIKE CONCAT('%', #{w}, '%'), 6, 0))" +
            "    + IF(p.tags LIKE CONCAT('%', #{w}, '%'), IF(FIND_IN_SET(#{w}, p.tags) > 0, 8, 4), 0)" +
            "    + IF(p.summary LIKE CONCAT('%', #{w}, '%'), 3, 0)" +
            "    + IF(p.content LIKE CONCAT('%', #{w}, '%'), 1, 0)" +
            "  </foreach>" +
            "  + IF(p.category = #{category}, 5, 0)" +
            "  + LEAST(p.view_count, 1000) / 1000" +
            "  + LEAST(p.like_count, 500) / 500 * 0.5" +
            ") AS relevance" +
            " FROM posts p WHERE p.status = 1" +
            " AND (" +
            "   <foreach collection='words' item='w' separator='OR'>" +
            "     p.title LIKE CONCAT('%', #{w}, '%')" +
            "     OR p.content LIKE CONCAT('%', #{w}, '%')" +
            "     OR p.summary LIKE CONCAT('%', #{w}, '%')" +
            "     OR p.tags LIKE CONCAT('%', #{w}, '%')" +
            "   </foreach>" +
            "   <if test='category != null and category != \"\"'>" +
            "     OR p.category = #{category}" +
            "   </if>" +
            " )" +
            " <if test='category != null and category != \"\"'>" +
            "   AND p.category = #{category}" +
            " </if>" +
            " ORDER BY p.is_top DESC, relevance DESC, p.created_at DESC" +
            "</script>")
    IPage<Post> smartSearch(Page<Post> page,
                            @Param("words") List<String> words,
                            @Param("category") String category);

    /**
     * 搜索建议：根据输入前缀快速匹配标题和标签
     */
    @Select("<script>" +
            "SELECT p.title FROM posts p WHERE p.status = 1" +
            " <foreach collection='words' item='w' separator=' '>" +
            "   AND p.title LIKE CONCAT('%', #{w}, '%')" +
            " </foreach>" +
            " GROUP BY p.title ORDER BY MAX(p.view_count) DESC LIMIT #{limit}" +
            "</script>")
    List<String> searchSuggestions(@Param("words") List<String> words,
                                   @Param("limit") Integer limit);

    /**
     * 原有简单搜索（保留兼容）
     */
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
