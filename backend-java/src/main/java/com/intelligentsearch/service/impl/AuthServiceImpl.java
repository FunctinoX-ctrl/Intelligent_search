package com.intelligentsearch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.Company;
import com.intelligentsearch.entity.EnterpriseUser;
import com.intelligentsearch.entity.PersonalUser;
import com.intelligentsearch.mapper.CompanyMapper;
import com.intelligentsearch.mapper.EnterpriseUserMapper;
import com.intelligentsearch.mapper.PersonalUserMapper;
import com.intelligentsearch.service.AuthService;
import com.intelligentsearch.util.JwtUtil;
import com.intelligentsearch.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import cn.hutool.crypto.digest.BCrypt;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private PersonalUserMapper personalUserMapper;

    @Autowired
    private EnterpriseUserMapper enterpriseUserMapper;

    @Autowired
    private CompanyMapper companyMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Result<Map<String, Object>> personalLogin(String username, String password) {
        LambdaQueryWrapper<PersonalUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PersonalUser::getUsername, username);
        PersonalUser user = personalUserMapper.selectOne(wrapper);

        if (user == null) {
            return Result.error("用户不存在");
        }

        if (user.getStatus() != 1) {
            return Result.error("账号已被禁用");
        }

        if (!BCrypt.checkpw(password, user.getPassword())) {
            return Result.error("密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), "personal");

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("email", user.getEmail());
        userInfo.put("role", user.getRole());
        userInfo.put("userType", "personal");

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", userInfo);

        return Result.success("登录成功", result);
    }

    @Override
    public Result<Map<String, Object>> enterpriseLogin(String email, String employeeId, String password) {
        LambdaQueryWrapper<EnterpriseUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EnterpriseUser::getEmail, email)
                .eq(EnterpriseUser::getEmployeeId, employeeId);
        EnterpriseUser user = enterpriseUserMapper.selectOne(wrapper);

        if (user == null) {
            return Result.error("用户不存在");
        }

        if (user.getStatus() != 1) {
            return Result.error("账号已被禁用");
        }

        if (!BCrypt.checkpw(password, user.getPassword())) {
            return Result.error("密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), "enterprise");

        Company company = companyMapper.selectById(user.getCompanyId());

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("companyId", user.getCompanyId());
        userInfo.put("employeeId", user.getEmployeeId());
        userInfo.put("email", user.getEmail());
        userInfo.put("realName", user.getRealName());
        userInfo.put("department", user.getDepartment());
        userInfo.put("position", user.getPosition());
        userInfo.put("role", user.getRole());
        userInfo.put("userType", "enterprise");
        if (company != null) {
            userInfo.put("companyName", company.getCompanyName());
            userInfo.put("companyCode", company.getCompanyCode());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", userInfo);

        return Result.success("登录成功", result);
    }

    @Override
    public Result<Map<String, Object>> personalRegister(String username, String password, String email) {
        LambdaQueryWrapper<PersonalUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PersonalUser::getUsername, username);
        if (personalUserMapper.selectCount(wrapper) > 0) {
            return Result.error("用户名已存在");
        }

        PersonalUser user = new PersonalUser();
        user.setUsername(username);
        user.setPassword(BCrypt.hashpw(password));
        user.setEmail(email);
        user.setRole("user");
        user.setStatus(1);
        personalUserMapper.insert(user);

        return Result.success("注册成功", null);
    }

    @Override
    public Result<Map<String, Object>> getCurrentUser() {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.error("未登录");
        }

        Map<String, Object> userInfo = new HashMap<>();

        if ("personal".equals(userType)) {
            PersonalUser user = personalUserMapper.selectById(userId);
            if (user != null) {
                userInfo.put("id", user.getId());
                userInfo.put("username", user.getUsername());
                userInfo.put("email", user.getEmail());
                userInfo.put("role", user.getRole());
                userInfo.put("userType", "personal");
            }
        } else if ("enterprise".equals(userType)) {
            EnterpriseUser user = enterpriseUserMapper.selectById(userId);
            if (user != null) {
                Company company = companyMapper.selectById(user.getCompanyId());
                userInfo.put("id", user.getId());
                userInfo.put("companyId", user.getCompanyId());
                userInfo.put("employeeId", user.getEmployeeId());
                userInfo.put("email", user.getEmail());
                userInfo.put("realName", user.getRealName());
                userInfo.put("department", user.getDepartment());
                userInfo.put("position", user.getPosition());
                userInfo.put("role", user.getRole());
                userInfo.put("userType", "enterprise");
                if (company != null) {
                    userInfo.put("companyName", company.getCompanyName());
                    userInfo.put("companyCode", company.getCompanyCode());
                }
            }
        }

        return Result.success(userInfo);
    }
}
