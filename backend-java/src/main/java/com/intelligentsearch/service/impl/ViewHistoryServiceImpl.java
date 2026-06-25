package com.intelligentsearch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.ViewHistory;
import com.intelligentsearch.mapper.ViewHistoryMapper;
import com.intelligentsearch.service.ViewHistoryService;
import com.intelligentsearch.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ViewHistoryServiceImpl implements ViewHistoryService {

    @Autowired
    private ViewHistoryMapper viewHistoryMapper;

    @Override
    public Result<IPage<ViewHistory>> getHistoryList(Integer page, Integer pageSize) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.success(new Page<>());
        }

        LambdaQueryWrapper<ViewHistory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ViewHistory::getUserId, userId)
                .eq(ViewHistory::getUserType, userType)
                .orderByDesc(ViewHistory::getCreatedAt);

        Page<ViewHistory> pageParam = new Page<>(page, pageSize);
        IPage<ViewHistory> result = viewHistoryMapper.selectPage(pageParam, wrapper);
        return Result.success(result);
    }

    @Override
    public Result<String> addHistory(Integer postId, String postTitle) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.success("未登录，跳过");
        }

        LambdaQueryWrapper<ViewHistory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ViewHistory::getUserId, userId)
                .eq(ViewHistory::getUserType, userType)
                .eq(ViewHistory::getPostId, postId);
        ViewHistory existing = viewHistoryMapper.selectOne(wrapper);

        if (existing != null) {
            existing.setCreatedAt(LocalDateTime.now());
            existing.setPostTitle(postTitle);
            viewHistoryMapper.updateById(existing);
        } else {
            ViewHistory history = new ViewHistory();
            history.setUserId(userId);
            history.setUserType(userType);
            history.setPostId(postId);
            history.setPostTitle(postTitle);
            history.setCreatedAt(LocalDateTime.now());
            viewHistoryMapper.insert(history);
        }

        return Result.success("已添加");
    }
}
