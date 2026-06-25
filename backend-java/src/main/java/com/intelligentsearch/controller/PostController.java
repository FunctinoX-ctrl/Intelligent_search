package com.intelligentsearch.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.intelligentsearch.common.Result;
import com.intelligentsearch.entity.Comment;
import com.intelligentsearch.entity.Post;
import com.intelligentsearch.service.CommentService;
import com.intelligentsearch.service.PostService;
import com.intelligentsearch.service.ViewHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private CommentService commentService;

    @Autowired
    private ViewHistoryService viewHistoryService;

    @GetMapping("/list")
    public Result<Map<String, Object>> getPostList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String category) {
        Result<IPage<Post>> result = postService.getPostList(page, pageSize, keyword, category);
        if (result.isSuccess() && result.getData() != null) {
            IPage<Post> pageData = result.getData();
            Map<String, Object> data = new HashMap<>();
            data.put("list", pageData.getRecords());
            data.put("total", (int) pageData.getTotal());
            data.put("page", (int) pageData.getCurrent());
            data.put("pageSize", (int) pageData.getSize());
            return Result.success(data);
        }
        return Result.error(result.getMessage());
    }

    @GetMapping("/search")
    public Result<Map<String, Object>> searchPosts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        if (keyword == null || keyword.trim().isEmpty()) {
            Map<String, Object> emptyData = new HashMap<>();
            emptyData.put("list", new java.util.ArrayList<>());
            emptyData.put("total", 0);
            emptyData.put("page", page);
            emptyData.put("pageSize", pageSize);
            return Result.success(emptyData);
        }
        return getPostList(page, pageSize, keyword, "");
    }

    @GetMapping("/hot")
    public Result<List<Post>> getHotPosts(@RequestParam(defaultValue = "10") Integer limit) {
        return postService.getHotPosts(limit);
    }

    @GetMapping("/detail/{id}")
    public Result<Post> getPostDetail(@PathVariable Integer id) {
        Result<Post> result = postService.getPostDetail(id);
        if (result.isSuccess() && result.getData() != null) {
            viewHistoryService.addHistory(id, result.getData().getTitle());
        }
        return result;
    }

    @PostMapping("/create")
    public Result<Map<String, Object>> createPost(@RequestBody Map<String, String> params) {
        String title = params.get("title");
        String content = params.get("content");
        String summary = params.getOrDefault("summary", "");
        String coverImage = params.getOrDefault("cover_image", "");
        String tags = params.getOrDefault("tags", "");
        String category = params.getOrDefault("category", "");
        return postService.createPost(title, content, summary, coverImage, tags, category);
    }

    @PutMapping("/update/{id}")
    public Result<String> updatePost(@PathVariable Integer id, @RequestBody Map<String, Object> params) {
        String title = (String) params.get("title");
        String content = (String) params.get("content");
        String summary = (String) params.get("summary");
        String coverImage = (String) params.get("cover_image");
        String tags = (String) params.get("tags");
        String category = (String) params.get("category");
        Integer status = params.get("status") != null ? (Integer) params.get("status") : null;
        return postService.updatePost(id, title, content, summary, coverImage, tags, category, status);
    }

    @DeleteMapping("/delete/{id}")
    public Result<String> deletePost(@PathVariable Integer id) {
        return postService.deletePost(id);
    }

    @GetMapping("/{id}/comments")
    public Result<Map<String, Object>> getComments(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        Result<IPage<Comment>> result = commentService.getComments(id, page, pageSize);
        if (result.isSuccess() && result.getData() != null) {
            IPage<Comment> pageData = result.getData();
            Map<String, Object> data = new HashMap<>();
            data.put("list", pageData.getRecords());
            data.put("total", (int) pageData.getTotal());
            data.put("page", (int) pageData.getCurrent());
            data.put("pageSize", (int) pageData.getSize());
            return Result.success(data);
        }
        return Result.error(result.getMessage());
    }

    @PostMapping("/{id}/comments")
    public Result<Integer> createComment(@PathVariable Integer id, @RequestBody Map<String, Object> params) {
        String content = (String) params.get("content");
        Integer parentId = params.get("parent_id") != null ? (Integer) params.get("parent_id") : 0;
        Integer replyToId = params.get("reply_to_id") != null ? (Integer) params.get("reply_to_id") : 0;
        return commentService.createComment(id, content, parentId, replyToId);
    }

    @DeleteMapping("/comments/{id}")
    public Result<String> deleteComment(@PathVariable Integer id) {
        return commentService.deleteComment(id);
    }

    @PostMapping("/{id}/like")
    public Result<Map<String, Object>> toggleLike(@PathVariable Integer id) {
        return postService.toggleLike(id);
    }

    @GetMapping("/{id}/like/status")
    public Result<Map<String, Object>> getLikeStatus(@PathVariable Integer id) {
        return postService.getLikeStatus(id);
    }

    @GetMapping("/user/{userId}")
    public Result<Map<String, Object>> getUserPosts(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "personal") String userType,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(defaultValue = "latest") String sort) {
        Result<IPage<Post>> result = postService.getUserPosts(userId, userType, page, pageSize, sort);
        if (result.isSuccess() && result.getData() != null) {
            IPage<Post> pageData = result.getData();
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
