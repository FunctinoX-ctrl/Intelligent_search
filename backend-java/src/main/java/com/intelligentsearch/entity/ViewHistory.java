package com.intelligentsearch.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("view_history")
public class ViewHistory {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer userId;
    private String userType;
    private Integer postId;
    private String postTitle;
    private LocalDateTime createdAt;
}
