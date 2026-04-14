package com.goalquest.identity.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goalquest.identity.dto.ErrorResponseDTO;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
// import java.util.Set;

@Component
@RequiredArgsConstructor
public class InternalServiceKeyFilter extends OncePerRequestFilter {

    @Value("${internal.service-key}")
    private String internalServiceKey;

    private final ObjectMapper objectMapper;

    // Rutas que requieren la clave interna
    // private static final Set<String> INTERNAL_PATHS = Set.of(
    // "/auth/validate-token",
    // "/audit/logs");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        // boolean isInternalEndpoint =
        // INTERNAL_PATHS.stream().anyMatch(path::endsWith);

        // /audit/logs POST es interno, GET es admin con JWT
        boolean isPostAudit = path.endsWith("/audit/logs") && "POST".equals(request.getMethod());
        boolean isValidateToken = path.endsWith("/auth/validate-token");

        if (isPostAudit || isValidateToken) {
            String serviceKey = request.getHeader("X-Internal-Service-Key");
            if (!internalServiceKey.equals(serviceKey)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                objectMapper.writeValue(response.getWriter(),
                        ErrorResponseDTO.builder()
                                .statusCode(401)
                                .error("UNAUTHORIZED")
                                .message("Clave de servicio interno inválida")
                                .build());
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
