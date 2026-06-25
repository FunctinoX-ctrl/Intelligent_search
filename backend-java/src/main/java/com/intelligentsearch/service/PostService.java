package com.intelligentsearch.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.Post;

import java.util.List;
import java.util.Map;

public interface PostService {
    Result<IPage<Post>> getPostList(Integer page, Integer pageSize, String keyword, String category);
    Result<List<Post>> getHotPosts(Integer limit);
    Result<Post> getPostDetail(Integer id);
    Result<Map<String, Object>> createPost(String title, String content, String summary, String coverImage, String tags, String category);
    Result<String> updatePost(Integer id, String title, String content, String summary, String coverImage, String tags, String category, Integer status);
    Result<String> deletePost(Integer id);
    Result<Map<String, Object>> toggleLike(Integer postId);
    Result<Map<String, Object>> getLikeStatus(Integer postId);
    Result<IPage<Post>> getUserPosts(Integer userId, String userType, Integer page, Integer pageSize, String sort);
}
