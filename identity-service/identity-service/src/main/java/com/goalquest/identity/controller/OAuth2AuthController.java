package com.goalquest.identity.controller;

import com.goalquest.identity.dto.OAuth2LoginResponseDTO;
import com.goalquest.identity.service.OAuth2AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/auth/oauth2")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "OAuth2 / Google")
public class OAuth2AuthController {

    private final OAuth2AuthService oauth2AuthService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * IS-11: Iniciar flujo OAuth2 con Google.
     * Redirige al usuario a la pantalla de login de Google.
     * Spring Security maneja esta redirección automáticamente en /oauth2/authorization/google.
     * Este endpoint es solo documentativo para Swagger.
     */
    @Operation(
        summary = "Iniciar login con Google (IS-11)",
        description = """
            Redirige al usuario a la página de autenticación de Google.
            
            **Uso**: Navegar directamente a `GET /oauth2/authorization/google` desde el navegador.
            Spring Security maneja el flujo completo (PKCE, state, etc.).
            
            Tras la autenticación, Google redirige a `/auth/oauth2/callback/google`
            donde el sistema emite el JWT propio.
            """,
        operationId = "IS-11"
    )
    @GetMapping("/login/google")
    public void initiateGoogleLogin(HttpServletResponse response) throws IOException {
        response.sendRedirect("/oauth2/authorization/google");
    }

    /**
     * IS-12: Callback OAuth2 — Spring Security llama a este endpoint tras el handshake con Google.
     * El usuario llega aquí autenticado; emitimos nuestro JWT y redirigimos al frontend.
     */
    @Operation(
        summary = "Callback OAuth2 de Google (IS-12)",
        description = """
            Endpoint de retorno tras autenticación con Google.
            
            **No llamar directamente** — es invocado por Spring Security después del handshake OAuth2.
            
            Comportamiento:
            - Si el usuario existe (por oauth2_id o email): genera JWT y actualiza datos.
            - Si el usuario es nuevo: crea cuenta, perfil de gamificación y genera JWT.
            - Redirige al frontend con el token: `{frontendUrl}/oauth2/success?token=...`
            """,
        operationId = "IS-12"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "302", description = "Redirige al frontend con token JWT"),
        @ApiResponse(responseCode = "500", description = "Error en el procesamiento OAuth2")
    })
    @GetMapping("/callback/google")
    public void googleCallback(
            OAuth2AuthenticationToken authToken,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        try {
            String ipAddress = getClientIp(request);
            OAuth2LoginResponseDTO result = oauth2AuthService.processOAuth2Login(authToken, ipAddress);

            // Redirigir al frontend con el token
            String redirectUrl = frontendUrl + "/oauth2/success"
                    + "?token=" + URLEncoder.encode(result.getAccessToken(), StandardCharsets.UTF_8)
                    + "&new_user=" + result.isNewUser()
                    + "&provider=" + result.getProvider();

            log.info("OAuth2 callback exitoso para: {}", result.getUser().getEmail());
            response.sendRedirect(redirectUrl);

        } catch (Exception e) {
            log.error("Error en callback OAuth2: {}", e.getMessage(), e);
            response.sendRedirect(frontendUrl + "/oauth2/error?msg="
                    + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    /**
     * IS-13: Endpoint JSON para obtener el JWT directamente (útil para clientes SPA/móvil).
     * El cliente llama a este endpoint después de que Spring Security completó el handshake.
     */
    @Operation(
        summary = "Obtener JWT tras callback OAuth2 — JSON (IS-13)",
        description = """
            Alternativa JSON al redirect del callback.
            
            Llamar desde un cliente que ya tiene el `OAuth2AuthenticationToken` en sesión
            (por ejemplo, en un flujo SPA donde se intercepta el redirect).
            Retorna el JWT y los datos del usuario directamente como JSON.
            """,
        operationId = "IS-13"
    )
    @GetMapping("/token")
    public ResponseEntity<OAuth2LoginResponseDTO> getTokenFromOAuth2(
            OAuth2AuthenticationToken authToken,
            HttpServletRequest request) {

        String ipAddress = getClientIp(request);
        OAuth2LoginResponseDTO result = oauth2AuthService.processOAuth2Login(authToken, ipAddress);
        return ResponseEntity.ok(result);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
