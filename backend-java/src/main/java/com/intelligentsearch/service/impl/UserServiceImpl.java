package com.intelligentsearch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.EnterpriseUser;
import com.intelligentsearch.entity.PersonalUser;
import com.intelligentsearch.entity.Post;
import com.intelligentsearch.mapper.EnterpriseUserMapper;
import com.intelligentsearch.mapper.PersonalUserMapper;
import com.intelligentsearch.mapper.PostMapper;
import com.intelligentsearch.service.UserService;
import com.intelligentsearch.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private PersonalUserMapper personalUserMapper;

    @Autowired
    private EnterpriseUserMapper enterpriseUserMapper;

    @Autowired
    private PostMapper postMapper;

    @Override
    public Result<Map<String, Object>> getUserProfile(Integer userId, String userType) {
        Map<String, Object> profile = new HashMap<>();

        if ("personal".equals(userType)) {
            PersonalUser user = personalUserMapper.selectById(userId);
            if (user == null) {
                return Result.error("用户不存在");
            }
            profile.put("id", user.getId());
            profile.put("user_type", "personal");
            profile.put("username", user.getUsername());
            profile.put("email", user.getEmail());
            profile.put("role", user.getRole());
            profile.put("status", user.getStatus());
            profile.put("created_at", user.getCreatedAt());
        } else if ("enterprise".equals(userType)) {
            EnterpriseUser user = enterpriseUserMapper.selectById(userId);
            if (user == null) {
                return Result.error("用户不存在");
            }
            profile.put("id", user.getId());
            profile.put("user_type", "enterprise");
            profile.put("company_id", user.getCompanyId());
            profile.put("employee_id", user.getEmployeeId());
            profile.put("email", user.getEmail());
            profile.put("real_name", user.getRealName());
            profile.put("department", user.getDepartment());
            profile.put("position", user.getPosition());
            profile.put("role", user.getRole());
            profile.put("status", user.getStatus());
            profile.put("created_at", user.getCreatedAt());
        } else {
            return Result.error("用户类型错误");
        }

        LambdaQueryWrapper<Post> postWrapper = new LambdaQueryWrapper<>();
        postWrapper.eq(Post::getAuthorId, userId)
                .eq(Post::getAuthorType, userType)
                .eq(Post::getStatus, 1);
        Long postCount = postMapper.selectCount(postWrapper);
        profile.put("post_count", postCount);

        return Result.success(profile);
    }

    @Override
    public Result<String> updateProfile(Map<String, Object> params) {
        Integer userId = UserContext.getUserId();
        String userType = UserContext.getUserType();

        if (userId == null || userType == null) {
            return Result.error("未登录");
        }

        if ("personal".equals(userType)) {
            PersonalUser user = personalUserMapper.selectById(userId);
            if (user == null) return Result.error("用户不存在");
            if (params.containsKey("email")) user.setEmail((String) params.get("email"));
            personalUserMapper.updateById(user);
        } else if ("enterprise".equals(userType)) {
            EnterpriseUser user = enterpriseUserMapper.selectById(userId);
            if (user == null) return Result.error("用户不存在");
            if (params.containsKey("email")) user.setEmail((String) params.get("email"));
            if (params.containsKey("real_name")) user.setRealName((String) params.get("real_name"));
            enterpriseUserMapper.updateById(user);
        }

        return Result.success("更新成功");
    }
}
