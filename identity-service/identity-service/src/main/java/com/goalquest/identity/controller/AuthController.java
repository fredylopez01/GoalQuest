package com.goalquest.identity.controller;

import com.goalquest.identity.dto.*;
import com.goalquest.identity.entity.User;
import com.goalquest.identity.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * IS-01 | POST /auth/register
     * Registrar un nuevo usuario.
     */
    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(
            @Valid @RequestBody RegisterRequestDTO dto,
            HttpServletRequest request) {
        UserDTO created = authService.register(dto, getClientIp(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * IS-02 | POST /auth/login
     * Autenticar usuario y retornar JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO dto,
            HttpServletRequest request) {
        LoginResponseDTO response = authService.login(dto, getClientIp(request));
        return ResponseEntity.ok(response);
    }

    /**
     * IS-03 | POST /auth/logout
     * Cerrar sesión (requiere Bearer Token).
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {
        authService.logout(user.getId(), getClientIp(request));
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada exitosamente"));
    }

    /**
     * IS-04 | POST /auth/validate-token
     * Validar JWT. Uso interno entre microservicios.
     * Protegido por X-Internal-Service-Key (InternalServiceKeyFilter).
     */
    @PostMapping("/validate-token")
    public ResponseEntity<ValidateTokenResponseDTO> validateToken(
            @Valid @RequestBody ValidateTokenRequestDTO dto) {
        ValidateTokenResponseDTO response = authService.validateToken(dto);

        if (!response.isValid()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    // ── Utilidad ─────────────────────────────────────────────────────────────

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
