package com.intelligentsearch.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("messages")
public class Message {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer userId;
    private String userType;
    private String type;
    private String title;
    private String content;
    private String relatedType;
    private Integer relatedId;
    private Integer fromUserId;
    private String fromUserName;
    private Integer isRead;
    private LocalDateTime createdAt;
}
