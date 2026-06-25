package com.intelligentsearch.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.Message;
import com.intelligentsearch.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @GetMapping("/list")
    public Result<Map<String, Object>> getMessageList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(defaultValue = "all") String type) {
        Result<IPage<Message>> result = messageService.getMessageList(page, pageSize, type);
        if (result.isSuccess() && result.getData() != null) {
            IPage<Message> pageData = result.getData();
            Map<String, Object> data = new HashMap<>();
            data.put("list", pageData.getRecords());
            data.put("total", (int) pageData.getTotal());
            data.put("page", (int) pageData.getCurrent());
            data.put("pageSize", (int) pageData.getSize());
            return Result.success(data);
        }
        return Result.error(result.getMessage());
    }

    @GetMapping("/unread-count")
    public Result<Integer> getUnreadCount() {
        return messageService.getUnreadCount();
    }

    @PostMapping("/read/{id}")
    public Result<String> markAsRead(@PathVariable Integer id) {
        return messageService.markAsRead(id);
    }

    @PostMapping("/read-all")
    public Result<String> markAllAsRead() {
        return messageService.markAllAsRead();
    }
}
