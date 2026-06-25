package com.intelligentsearch.service;

import com.intelligentsearch.common.Result;

import java.util.Map;

public interface AuthService {
    Result<Map<String, Object>> personalLogin(String username, String password);
    Result<Map<String, Object>> enterpriseLogin(String email, String employeeId, String password);
    Result<Map<String, Object>> personalRegister(String username, String password, String email);
    Result<Map<String, Object>> getCurrentUser();
}
