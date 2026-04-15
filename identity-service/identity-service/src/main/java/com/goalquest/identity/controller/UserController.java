package com.goalquest.identity.controller;

import com.goalquest.identity.dto.*;
import com.goalquest.identity.entity.User;
import com.goalquest.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Usuarios")
@SecurityRequirement(name = "bearer-jwt")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Obtener mi perfil", description = """
            Retorna el perfil completo del usuario autenticado, incluyendo
            email, rol, URL de avatar y fecha de creación de la cuenta.
            """, operationId = "IS-05")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil del usuario autenticado", content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "401", description = "Token inválido o expirado", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getMyProfile(@AuthenticationPrincipal User user) {
        UserDTO dto = userService.getProfile(user.getId());
        return ResponseEntity.ok(dto);
    }

    @Operation(summary = "Editar mi perfil", description = """
            Actualiza los datos del perfil del usuario autenticado.
            Solo se modifican los campos enviados (actualización parcial).

            **Campos editables:**
            - `name`: Nombre del usuario (2-100 caracteres)
            - `avatar_url`: URL de la imagen de perfil
            """, operationId = "IS-06")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil actualizado exitosamente", content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = """
                    {
                        "statusCode": 400,
                        "error": "VALIDATION_ERROR",
                        "message": ["El nombre debe tener entre 2 y 100 caracteres"]
                    }
                    """))),
            @ApiResponse(responseCode = "401", description = "Token inválido o expirado", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PatchMapping("/profile")
    public ResponseEntity<UserDTO> updateMyProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProfileUpdateDTO dto) {
        UserDTO updated = userService.updateProfile(user.getId(), dto);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Obtener usuario por ID", description = """
            Retorna la información pública de un usuario específico.
            No incluye email ni datos sensibles.

            Utilizado internamente por `challenge-service` para obtener
            nombres de participantes en desafíos.
            """, operationId = "IS-07")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Información pública del usuario", content = @Content(schema = @Schema(implementation = PublicUserDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario no existe", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = """
                    {
                        "statusCode": 404,
                        "error": "USER_NOT_FOUND",
                        "message": "El usuario no existe"
                    }
                    """)))
    })
    @GetMapping("/{userId}")
    public ResponseEntity<PublicUserDTO> getUserById(
            @Parameter(description = "UUID del usuario", example = "d3aea65d-6c5c-45c0-b925-4554601b6dcd") @PathVariable UUID userId) {
        PublicUserDTO dto = userService.getPublicUserById(userId);
        return ResponseEntity.ok(dto);
    }

    @Operation(summary = "Buscar y listar usuarios", description = """
            Lista usuarios con paginación y búsqueda opcional.
            El parámetro `search` filtra por coincidencia parcial en nombre o email.

            **Paginación:**
            - `page`: Número de página (desde 1)
            - `limit`: Cantidad de resultados por página (máximo recomendado: 50)
            """, operationId = "IS-08")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada de usuarios"),
            @ApiResponse(responseCode = "401", description = "Token inválido o expirado", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @GetMapping
    public ResponseEntity<PaginatedResponseDTO<UserDTO>> searchUsers(
            @Parameter(description = "Texto de búsqueda (nombre o email)", example = "juan") @RequestParam(required = false) String search,
            @Parameter(description = "Número de página", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Resultados por página", example = "20") @RequestParam(defaultValue = "20") int limit) {
        PaginatedResponseDTO<UserDTO> result = userService.searchUsers(search, page, limit);
        return ResponseEntity.ok(result);
    }
}
