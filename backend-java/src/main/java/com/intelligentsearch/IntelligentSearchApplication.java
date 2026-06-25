package com.intelligentsearch;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.intelligentsearch.mapper")
public class IntelligentSearchApplication {
    public static void main(String[] args) {
        SpringApplication.run(IntelligentSearchApplication.class, args);
        System.out.println("================================================");
        System.out.println("  Intelligent Search Backend Started!");
        System.out.println("  Java 17 + Spring Boot 3.2 + MyBatis-Plus");
        System.out.println("================================================");
    }
}
