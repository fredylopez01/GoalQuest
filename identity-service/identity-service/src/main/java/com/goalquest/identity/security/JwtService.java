package com.goalquest.identity.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private int expiration; 

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(UUID userId, String email, String rol) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (long) expiration * 1000);

        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("email", email)
                .claim("rol", rol)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims validateAndGetClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenValid(String token) {
        try {
            validateAndGetClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Token inválido: {}", e.getMessage());
            return false;
        }
    }

    public String getUserIdFromToken(String token) {
        return validateAndGetClaims(token).getSubject();
    }

    public String getEmailFromToken(String token) {
        return validateAndGetClaims(token).get("email", String.class);
    }

    public String getRolFromToken(String token) {
        return validateAndGetClaims(token).get("rol", String.class);
    }

    public int getExpiration() {
        return expiration;
    }
}
