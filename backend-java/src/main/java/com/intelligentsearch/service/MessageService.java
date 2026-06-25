package com.intelligentsearch.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.Message;

public interface MessageService {
    Result<IPage<Message>> getMessageList(Integer page, Integer pageSize, String type);
    Result<Integer> getUnreadCount();
    Result<String> markAsRead(Integer id);
    Result<String> markAllAsRead();
}
