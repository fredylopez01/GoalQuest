package com.goalquest.identity.service;

import com.goalquest.identity.config.GamificationClient;
import com.goalquest.identity.dto.OAuth2LoginResponseDTO;
import com.goalquest.identity.dto.UserDTO;
import com.goalquest.identity.entity.User;
import com.goalquest.identity.repository.UserRepository;
import com.goalquest.identity.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Servicio encargado de manejar el flujo OAuth2:
 * - Extraer datos del usuario desde el proveedor (Google)
 * - Crear o recuperar el usuario en la BD local
 * - Emitir un JWT propio del sistema
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final GamificationClient gamificationClient;

    @Transactional
    public OAuth2LoginResponseDTO processOAuth2Login(
            OAuth2AuthenticationToken authToken,
            String ipAddress) {

        String provider = authToken.getAuthorizedClientRegistrationId(); // "google"
        OAuth2User oauth2User = authToken.getPrincipal();

        // Extraer atributos según el proveedor
        String oauth2Id = extractId(provider, oauth2User);
        String email    = oauth2User.getAttribute("email");
        String name     = oauth2User.getAttribute("name");
        String avatar   = oauth2User.getAttribute("picture");

        if (email == null || email.isBlank()) {
            throw new IllegalStateException("El proveedor OAuth2 no proporcionó un email válido.");
        }

        // Buscar primero por oauth2Provider + oauth2Id (cuenta previamente vinculada)
        Optional<User> byOauth2 = userRepository.findByOauth2ProviderAndOauth2Id(provider, oauth2Id);

        boolean isNewUser = false;
        User user;

        if (byOauth2.isPresent()) {
            // Usuario ya vinculado — actualizar avatar y nombre si cambiaron
            user = byOauth2.get();
            user.setAvatarUrl(avatar);
            if (name != null && !name.isBlank()) user.setName(name);
            user = userRepository.save(user);
            log.debug("OAuth2 login existente: usuario {} via {}", user.getEmail(), provider);

        } else {
            // Puede que el email exista con cuenta local → vincular proveedor
            Optional<User> byEmail = userRepository.findByEmail(email);

            if (byEmail.isPresent()) {
                user = byEmail.get();
                // Vincular el proveedor OAuth2 si aún no lo tiene
                if (user.getOauth2Provider() == null) {
                    user.setOauth2Provider(provider);
                    user.setOauth2Id(oauth2Id);
                    user.setAvatarUrl(avatar);
                    user = userRepository.save(user);
                    log.info("Cuenta local {} vinculada con {}", email, provider);
                }
            } else {
                // Primera vez: crear cuenta nueva
                user = User.builder()
                        .name(name != null ? name : email.split("@")[0])
                        .email(email)
                        .hashPassword(null)   // sin contraseña local
                        .rol("USER")
                        .avatarUrl(avatar)
                        .oauth2Provider(provider)
                        .oauth2Id(oauth2Id)
                        .build();

                user = userRepository.save(user);
                isNewUser = true;
                log.info("Nuevo usuario creado via OAuth2 ({}): {}", provider, email);

                // Crear perfil de gamificación
                try {
                    gamificationClient.createGamificationProfile(
                            new GamificationClient.CreateProfileRequest(user.getId().toString()));
                } catch (Exception e) {
                    log.warn("No se pudo crear perfil de gamificación para {}: {}", user.getId(), e.getMessage());
                }
            }
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRol());

        auditLogService.log(user.getId(), "OAUTH2_LOGIN",
                String.format("Login OAuth2 via %s desde IP: %s", provider, ipAddress),
                ipAddress);

        return OAuth2LoginResponseDTO.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpiration())
                .user(UserDTO.fromEntity(user))
                .newUser(isNewUser)
                .provider(provider)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String extractId(String provider, OAuth2User oauth2User) {
        return switch (provider) {
            case "google" -> oauth2User.getAttribute("sub");
            case "github" -> {
                Object id = oauth2User.getAttribute("id");
                yield id != null ? id.toString() : null;
            }
            default -> oauth2User.getName();
        };
    }
}
