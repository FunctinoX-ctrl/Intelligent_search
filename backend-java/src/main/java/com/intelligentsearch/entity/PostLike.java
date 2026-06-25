package com.intelligentsearch.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("post_likes")
public class PostLike {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer postId;
    private String userType;
    private Integer userId;
    private LocalDateTime createdAt;
}
