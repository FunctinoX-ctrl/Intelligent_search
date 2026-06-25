package com.intelligentsearch.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.intelligentsearch.entity.Message;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {
}
