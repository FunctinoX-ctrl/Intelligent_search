package com.intelligentsearch.controller;

import com.intelligentsearch.common.Result;
import com.intelligentsearch.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public Result<Map<String, Object>> getProfile(
            @RequestParam Integer userId,
            @RequestParam String userType) {
        return userService.getUserProfile(userId, userType);
    }

    @PutMapping("/profile/update")
    public Result<String> updateProfile(@RequestBody Map<String, Object> params) {
        return userService.updateProfile(params);
    }
}
