package com.goalquest.identity.service;

import com.goalquest.identity.config.GamificationClient;
import com.goalquest.identity.dto.*;
import com.goalquest.identity.entity.User;
import com.goalquest.identity.exception.EmailAlreadyExistsException;
import com.goalquest.identity.exception.InvalidCredentialsException;
import com.goalquest.identity.repository.UserRepository;
import com.goalquest.identity.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final GamificationClient gamificationClient;

    @Transactional
    public UserDTO register(RegisterRequestDTO dto, String ipAddress) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new EmailAlreadyExistsException();
        }

        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .hashPassword(passwordEncoder.encode(dto.getPassword()))
                .rol("USER")
                .build();

        User saved = userRepository.save(user);

        // Llamar al gamification-service para crear perfil (IS-01 — Nota del contrato)
        try {
            gamificationClient.createGamificationProfile(
                    new GamificationClient.CreateProfileRequest(saved.getId().toString())
            );
        } catch (Exception e) {
            // No bloquear el registro si gamification falla; se puede reintentar
            log.warn("No se pudo crear perfil de gamificación para usuario {}: {}", saved.getId(), e.getMessage());
        }

        return UserDTO.fromEntity(saved);
    }

    public LoginResponseDTO login(LoginRequestDTO dto, String ipAddress) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(dto.getPassword(), user.getHashPassword())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRol());

        // Registrar en audit_log: action = "LOGIN" (IS-02 — Nota del contrato)
        auditLogService.log(user.getId(), "LOGIN",
                "Inicio de sesión desde IP: " + ipAddress, ipAddress);

        return LoginResponseDTO.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpiration())
                .user(UserDTO.fromEntity(user))
                .build();
    }

    public void logout(UUID userId, String ipAddress) {
        // Registrar en audit_log: action = "LOGOUT" (IS-03 — Nota del contrato)
        // JWT es stateless; el cliente debe descartar el token localmente.
        auditLogService.log(userId, "LOGOUT",
                "Cierre de sesión desde IP: " + ipAddress, ipAddress);
    }

    public ValidateTokenResponseDTO validateToken(ValidateTokenRequestDTO dto) {
        String token = dto.getToken();

        if (!jwtService.isTokenValid(token)) {
            return ValidateTokenResponseDTO.builder()
                    .valid(false)
                    .build();
        }

        return ValidateTokenResponseDTO.builder()
                .valid(true)
                .userId(jwtService.getUserIdFromToken(token))
                .email(jwtService.getEmailFromToken(token))
                .rol(jwtService.getRolFromToken(token))
                .build();
    }
}
