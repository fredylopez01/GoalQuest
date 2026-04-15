package com.goalquest.identity.controller;

import com.goalquest.identity.dto.*;
import com.goalquest.identity.entity.User;
import com.goalquest.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Registrar nuevo usuario", description = """
            Crea una nueva cuenta de usuario en el sistema.
            - La contraseña se hashea con BCrypt antes de almacenarse.
            - Se crea automáticamente un perfil de gamificación en el servicio correspondiente.
            - El rol por defecto es `USER`.
            """, operationId = "IS-01")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario registrado exitosamente", content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos (nombre muy corto, email mal formateado, contraseña menor a 8 caracteres)", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = """
                    {
                        "statusCode": 400,
                        "error": "VALIDATION_ERROR",
                        "message": ["El nombre debe tener entre 2 y 100 caracteres", "La contraseña debe tener al menos 8 caracteres"]
                    }
                    """))),
            @ApiResponse(responseCode = "409", description = "El email ya está registrado en el sistema", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = """
                    {
                        "statusCode": 409,
                        "error": "EMAIL_EXISTS",
                        "message": "El email ya está registrado"
                    }
                    """)))
    })
    @SecurityRequirement(name = "")
    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(
            @Valid @RequestBody RegisterRequestDTO dto,
            HttpServletRequest request) {
        UserDTO created = authService.register(dto, getClientIp(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Iniciar sesión", description = """
            Autentica al usuario con email y contraseña, retornando un token JWT.
            - El token tiene una expiración configurable (por defecto 24 horas).
            - Se registra la acción `LOGIN` en el log de auditoría.
            - El token debe enviarse en el header `Authorization: Bearer <token>` para endpoints protegidos.
            """, operationId = "IS-02")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login exitoso, retorna token JWT y datos del usuario", content = @Content(schema = @Schema(implementation = LoginResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Email o contraseña incorrectos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = """
                    {
                        "statusCode": 401,
                        "error": "INVALID_CREDENTIALS",
                        "message": "Email o contraseña incorrectos"
                    }
                    """)))
    })
    @SecurityRequirement(name = "")
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO dto,
            HttpServletRequest request) {
        LoginResponseDTO response = authService.login(dto, getClientIp(request));
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Cerrar sesión", description = """
            Cierra la sesión del usuario autenticado.
            - Requiere un token JWT válido en el header `Authorization`.
            - Se registra la acción `LOGOUT` en el log de auditoría con la IP del cliente.
            """, operationId = "IS-03")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Sesión cerrada exitosamente", content = @Content(examples = @ExampleObject(value = """
                    {
                        "message": "Sesión cerrada exitosamente"
                    }
                    """))),
            @ApiResponse(responseCode = "401", description = "Token inválido o expirado", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirement(name = "bearer-jwt")
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {
        authService.logout(user.getId(), getClientIp(request));
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada exitosamente"));
    }

    @Operation(summary = "Validar token JWT (uso interno)", description = """
            Valida un token JWT y retorna la información del usuario asociado.

            **Endpoint interno** — Solo para comunicación entre microservicios.
            Requiere el header `X-Internal-Service-Key` con la clave secreta compartida.

            Usado por `task-service` y `challenge-service` para verificar la autenticación
            de las peticiones que reciben de los clientes.
            """, operationId = "IS-04")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token válido, retorna datos del usuario", content = @Content(schema = @Schema(implementation = ValidateTokenResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Token inválido o expirado", content = @Content(schema = @Schema(implementation = ValidateTokenResponseDTO.class), examples = @ExampleObject(value = """
                    {
                        "valid": false,
                        "user_id": null,
                        "email": null,
                        "rol": null
                    }
                    """)))
    })
    @SecurityRequirement(name = "internal-key")
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
