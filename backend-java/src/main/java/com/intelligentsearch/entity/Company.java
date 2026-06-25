package com.intelligentsearch.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("companies")
public class Company {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String companyName;
    private String companyCode;
    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
