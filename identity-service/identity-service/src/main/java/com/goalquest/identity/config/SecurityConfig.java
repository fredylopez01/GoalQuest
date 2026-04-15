package com.goalquest.identity.config;

import com.goalquest.identity.security.InternalServiceKeyFilter;
import com.goalquest.identity.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final InternalServiceKeyFilter internalServiceKeyFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ── Swagger UI ──────────────────────────────────────
                        .requestMatchers(
                                "/docs/**",
                                "/docs",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/api-docs",
                                "/v3/api-docs/**",
                                "/v3/api-docs")
                        .permitAll()
                        // ── Actuator ────────────────────────────────────────
                        .requestMatchers("/actuator/**").permitAll()
                        // ── Auth públicos ───────────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        // ── Internos (validados por InternalServiceKeyFilter) ──
                        .requestMatchers(HttpMethod.POST, "/auth/validate-token").permitAll()
                        .requestMatchers(HttpMethod.POST, "/audit/logs").permitAll()
                        // ── Auth protegidos ─────────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/auth/logout").authenticated()
                        // ── Usuarios ────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/users/profile").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/users/profile").authenticated()
                        .requestMatchers(HttpMethod.GET, "/users/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/users").authenticated()
                        // ── Auditoría ───────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/audit/logs").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(internalServiceKeyFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
