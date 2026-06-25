package com.intelligentsearch.util;

public class UserContext {
    private static final ThreadLocal<Integer> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userTypeHolder = new ThreadLocal<>();

    public static void setUserId(Integer userId) {
        userIdHolder.set(userId);
    }

    public static Integer getUserId() {
        return userIdHolder.get();
    }

    public static void setUserType(String userType) {
        userTypeHolder.set(userType);
    }

    public static String getUserType() {
        return userTypeHolder.get();
    }

    public static void clear() {
        userIdHolder.remove();
        userTypeHolder.remove();
    }
}
