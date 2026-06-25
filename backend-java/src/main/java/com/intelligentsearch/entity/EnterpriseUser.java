package com.intelligentsearch.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("enterprise_users")
public class EnterpriseUser {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer companyId;
    private String employeeId;
    private String email;
    private String password;
    private String realName;
    private String department;
    private String position;
    private String role;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
