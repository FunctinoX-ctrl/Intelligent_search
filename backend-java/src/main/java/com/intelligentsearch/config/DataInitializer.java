package com.intelligentsearch.config;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intelligentsearch.entity.*;
import com.intelligentsearch.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private PersonalUserMapper personalUserMapper;

    @Autowired
    private EnterpriseUserMapper enterpriseUserMapper;

    @Autowired
    private CompanyMapper companyMapper;

    @Autowired
    private PostMapper postMapper;

    @Override
    public void run(String... args) {
        initRootUsers();
        initSamplePosts();
        System.out.println("数据初始化完成！");
    }

    private void initRootUsers() {
        try {
            LambdaQueryWrapper<PersonalUser> personalWrapper = new LambdaQueryWrapper<>();
            personalWrapper.eq(PersonalUser::getUsername, "root");
            Long personalCount = personalUserMapper.selectCount(personalWrapper);

            if (personalCount == 0) {
                PersonalUser root = new PersonalUser();
                root.setUsername("root");
                root.setPassword(BCrypt.hashpw("Root@123456"));
                root.setEmail("root@personal.com");
                root.setRole("root");
                root.setStatus(1);
                personalUserMapper.insert(root);
                System.out.println("个人用户root账户创建成功！用户名: root, 密码: Root@123456");
            } else {
                System.out.println("个人用户root账户已存在");
            }

            Integer companyId;
            LambdaQueryWrapper<Company> companyWrapper = new LambdaQueryWrapper<>();
            companyWrapper.eq(Company::getCompanyCode, "ROOT");
            Long companyCount = companyMapper.selectCount(companyWrapper);

            if (companyCount == 0) {
                Company company = new Company();
                company.setCompanyName("系统管理企业");
                company.setCompanyCode("ROOT");
                company.setContactName("系统管理员");
                company.setStatus(1);
                companyMapper.insert(company);
                companyId = company.getId();
                System.out.println("系统管理企业创建成功");
            } else {
                Company company = companyMapper.selectOne(companyWrapper);
                companyId = company.getId();
            }

            LambdaQueryWrapper<EnterpriseUser> enterpriseWrapper = new LambdaQueryWrapper<>();
            enterpriseWrapper.eq(EnterpriseUser::getEmail, "root@enterprise.com");
            Long enterpriseCount = enterpriseUserMapper.selectCount(enterpriseWrapper);

            if (enterpriseCount == 0) {
                EnterpriseUser root = new EnterpriseUser();
                root.setCompanyId(companyId);
                root.setEmployeeId("ROOT001");
                root.setEmail("root@enterprise.com");
                root.setPassword(BCrypt.hashpw("Root@123456"));
                root.setRealName("系统管理员");
                root.setDepartment("管理部");
                root.setPosition("超级管理员");
                root.setRole("root");
                root.setStatus(1);
                enterpriseUserMapper.insert(root);
                System.out.println("企业用户root账户创建成功！邮箱: root@enterprise.com, 工号: ROOT001, 密码: Root@123456");
            } else {
                System.out.println("企业用户root账户已存在");
            }
        } catch (Exception e) {
            System.err.println("初始化root用户失败: " + e.getMessage());
        }
    }

    private void initSamplePosts() {
        try {
            LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Post::getStatus, 1);
            Long count = postMapper.selectCount(wrapper);

            if (count > 0) {
                System.out.println("示例帖子已存在，跳过初始化");
                return;
            }

            List<Post> samplePosts = Arrays.asList(
                createPost("智能搜索技术发展趋势与应用前景",
                    "随着人工智能技术的快速发展，智能搜索已经成为信息检索领域的重要方向。本文将从技术原理、应用场景、发展趋势等多个维度，深入探讨智能搜索的现状与未来。智能搜索不仅能够理解用户的自然语言查询，还能根据上下文和用户意图提供精准的搜索结果。",
                    "深入探讨智能搜索技术的发展现状、核心技术以及未来应用前景...",
                    "personal", 1, "系统管理员", null,
                    "智能搜索,AI,技术趋势", "技术"),
                createPost("企业数字化转型中的信息检索解决方案",
                    "在数字化转型的浪潮中，企业面临着海量数据的管理和检索挑战。本文介绍了几种主流的企业级搜索解决方案，包括Elasticsearch、Solr等开源框架，以及基于云服务的搜索解决方案。通过合理的架构设计和技术选型，企业可以构建高效、稳定、安全的内部知识检索系统。",
                    "企业数字化转型背景下，如何构建高效的企业级信息检索系统...",
                    "enterprise", 1, "系统管理企业", 1,
                    "企业数字化,信息检索,解决方案", "企业"),
                createPost("自然语言处理在搜索引擎中的应用实践",
                    "自然语言处理（NLP）是智能搜索的核心技术之一。本文详细介绍了分词、词性标注、命名实体识别、语义理解等NLP技术在搜索引擎中的具体应用。通过这些技术，搜索引擎能够更好地理解用户的查询意图，返回更加相关的搜索结果。",
                    "NLP技术如何赋能智能搜索，提升搜索结果的相关性和准确性...",
                    "personal", 1, "系统管理员", null,
                    "NLP,自然语言处理,搜索引擎", "技术"),
                createPost("推荐系统与搜索技术的融合创新",
                    "推荐系统和搜索技术在互联网产品中扮演着重要角色。本文探讨了推荐系统与搜索技术的融合路径，包括搜索结果个性化排序、基于搜索行为的推荐优化、以及\"搜索即推荐\"的新型交互模式。两者的结合能够为用户提供更加智能、精准的信息服务。",
                    "搜索与推荐的技术融合，打造更智能的信息发现体验...",
                    "personal", 1, "系统管理员", null,
                    "推荐系统,搜索技术,个性化", "技术"),
                createPost("知识图谱在企业搜索中的应用价值",
                    "知识图谱技术为企业搜索带来了新的可能性。通过构建企业知识图谱，可以实现实体级别的搜索、关联关系发现、智能问答等高级功能。本文结合实际案例，介绍了企业知识图谱的构建方法和应用场景。",
                    "知识图谱如何提升企业搜索的智能化水平和信息价值...",
                    "enterprise", 1, "系统管理企业", 1,
                    "知识图谱,企业搜索,智能问答", "企业"),
                createPost("移动端搜索体验优化最佳实践",
                    "移动端已成为用户搜索的主要入口。本文从界面设计、交互方式、性能优化三个方面，分享了移动端搜索体验优化的最佳实践。包括搜索框设计、联想词优化、搜索结果展示、语音搜索等功能的设计要点。",
                    "移动端搜索用户体验设计与优化的实用技巧...",
                    "personal", 1, "系统管理员", null,
                    "移动端,用户体验,搜索优化", "设计"),
                createPost("搜索结果排序算法深度解析",
                    "搜索结果排序是搜索引擎的核心技术。本文深入解析了经典排序算法和现代机器学习排序算法，包括TF-IDF、BM25、Learning to Rank等。同时还介绍了排序评估指标和A/B测试方法。",
                    "从经典算法到机器学习，全面解析搜索排序技术...",
                    "personal", 1, "系统管理员", null,
                    "排序算法,机器学习,搜索技术", "技术"),
                createPost("企业知识库建设与智能检索",
                    "企业知识库是企业知识管理的重要载体。本文介绍了企业知识库的建设方法论，包括知识采集、知识组织、知识标注等环节，并重点讨论了如何利用智能检索技术提升知识库的使用效率。",
                    "构建企业知识库，实现知识的高效管理与智能检索...",
                    "enterprise", 1, "系统管理企业", 1,
                    "知识库,知识管理,企业管理", "企业")
            );

            for (Post post : samplePosts) {
                postMapper.insert(post);
            }
            System.out.println("初始化 " + samplePosts.size() + " 篇示例帖子成功！");
        } catch (Exception e) {
            System.err.println("初始化示例帖子失败: " + e.getMessage());
        }
    }

    private Post createPost(String title, String content, String summary,
                            String authorType, Integer authorId, String authorName,
                            Integer companyId, String tags, String category) {
        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setSummary(summary);
        post.setAuthorType(authorType);
        post.setAuthorId(authorId);
        post.setAuthorName(authorName);
        post.setCompanyId(companyId);
        post.setViewCount(0);
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setIsTop(0);
        post.setTags(tags);
        post.setCategory(category);
        post.setStatus(1);
        return post;
    }
}
