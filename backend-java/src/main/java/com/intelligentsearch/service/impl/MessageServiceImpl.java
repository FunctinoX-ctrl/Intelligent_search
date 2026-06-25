package com.intelligentsearch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.Message;
import com.intelligentsearch.mapper.MessageMapper;
import com.intelligentsearch.service.MessageService;
import com.intelligentsearch.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageServiceImpl implements MessageService {

    @Autowired
    private MessageMapper messageMapper;

    @Override
    public Result<IPage<Message>> getMessageList(Integer page, Integer pageSize, String type) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.error("未登录");
        }

        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getUserId, userId)
                .eq(Message::getUserType, userType)
                .orderByDesc(Message::getCreatedAt);

        if (type != null && !"all".equals(type) && !type.isEmpty()) {
            wrapper.eq(Message::getType, type);
        }

        Page<Message> pageParam = new Page<>(page, pageSize);
        IPage<Message> result = messageMapper.selectPage(pageParam, wrapper);
        return Result.success(result);
    }

    @Override
    public Result<Integer> getUnreadCount() {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.success(0);
        }

        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getUserId, userId)
                .eq(Message::getUserType, userType)
                .eq(Message::getIsRead, 0);

        Long count = messageMapper.selectCount(wrapper);
        return Result.success(count.intValue());
    }

    @Override
    public Result<String> markAsRead(Integer id) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        Message msg = messageMapper.selectById(id);
        if (msg == null) {
            return Result.error("消息不存在");
        }

        if (!msg.getUserId().equals(userId) || !msg.getUserType().equals(userType)) {
            return Result.error("无权限");
        }

        msg.setIsRead(1);
        messageMapper.updateById(msg);
        return Result.success("已标记为已读");
    }

    @Override
    public Result<String> markAllAsRead() {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.error("未登录");
        }

        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getUserId, userId)
                .eq(Message::getUserType, userType)
                .eq(Message::getIsRead, 0);

        Message update = new Message();
        update.setIsRead(1);
        messageMapper.update(update, wrapper);
        return Result.success("全部已读");
    }
}
