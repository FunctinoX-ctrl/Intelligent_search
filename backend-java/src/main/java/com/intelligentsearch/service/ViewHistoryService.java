package com.intelligentsearch.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.ViewHistory;

public interface ViewHistoryService {
    Result<IPage<ViewHistory>> getHistoryList(Integer page, Integer pageSize);
    Result<String> addHistory(Integer postId, String postTitle);
}
