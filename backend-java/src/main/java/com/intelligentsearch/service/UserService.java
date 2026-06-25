package com.intelligentsearch.service;

import com.intelligentsearch.common.Result;

import java.util.Map;

public interface UserService {
    Result<Map<String, Object>> getUserProfile(Integer userId, String userType);
    Result<String> updateProfile(Map<String, Object> params);
}
