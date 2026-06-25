package com.intelligentsearch.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Integer userId, String userType) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("userType", userType);
        return createToken(claims);
    }

    private String createToken(Map<String, Object> claims) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            return null;
        }
    }

    public Integer getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        if (claims != null && claims.get("userId") != null) {
            return (Integer) claims.get("userId");
        }
        return null;
    }

    public String getUserTypeFromToken(String token) {
        Claims claims = parseToken(token);
        if (claims != null && claims.get("userType") != null) {
            return (String) claims.get("userType");
        }
        return null;
    }

    public boolean validateToken(String token) {
        Claims claims = parseToken(token);
        if (claims == null) return false;
        return claims.getExpiration().after(new Date());
    }
}
