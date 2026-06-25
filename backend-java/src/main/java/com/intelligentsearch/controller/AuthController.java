package com.intelligentsearch.controller;

import com.intelligentsearch.common.Result;
import com.intelligentsearch.dto.EnterpriseLoginDTO;
import com.intelligentsearch.dto.PersonalLoginDTO;
import com.intelligentsearch.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/personal/login")
    public Result<Map<String, Object>> personalLogin(@RequestBody PersonalLoginDTO dto) {
        return authService.personalLogin(dto.getUsername(), dto.getPassword());
    }

    @PostMapping("/personal/register")
    public Result<Map<String, Object>> personalRegister(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        String email = params.get("email");
        return authService.personalRegister(username, password, email);
    }

    @PostMapping("/enterprise/login")
    public Result<Map<String, Object>> enterpriseLogin(@RequestBody EnterpriseLoginDTO dto) {
        return authService.enterpriseLogin(dto.getEmail(), dto.getEmployeeId(), dto.getPassword());
    }

    @GetMapping("/user")
    public Result<Map<String, Object>> getCurrentUser() {
        return authService.getCurrentUser();
    }

    @PostMapping("/logout")
    public Result<String> logout() {
        return Result.success("退出成功");
    }
}
