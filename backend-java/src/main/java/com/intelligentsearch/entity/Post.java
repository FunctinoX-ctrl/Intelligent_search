package com.intelligentsearch.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("posts")
public class Post {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String title;
    private String content;
    private String summary;
    private String coverImage;
    private String authorType;
    private Integer authorId;
    private String authorName;
    private Integer companyId;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Integer isTop;
    private String tags;
    private String category;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
