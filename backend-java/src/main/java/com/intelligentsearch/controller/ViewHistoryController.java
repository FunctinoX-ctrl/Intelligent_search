package com.intelligentsearch.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.ViewHistory;
import com.intelligentsearch.service.ViewHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
public class ViewHistoryController {

    @Autowired
    private ViewHistoryService viewHistoryService;

    @GetMapping("/list")
    public Result<Map<String, Object>> getHistoryList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        Result<IPage<ViewHistory>> result = viewHistoryService.getHistoryList(page, pageSize);
        if (result.isSuccess() && result.getData() != null) {
            IPage<ViewHistory> pageData = result.getData();
            Map<String, Object> data = new HashMap<>();
            data.put("list", pageData.getRecords());
            data.put("total", (int) pageData.getTotal());
            data.put("page", (int) pageData.getCurrent());
            data.put("pageSize", (int) pageData.getSize());
            return Result.success(data);
        }
        return Result.error(result.getMessage());
    }
}
