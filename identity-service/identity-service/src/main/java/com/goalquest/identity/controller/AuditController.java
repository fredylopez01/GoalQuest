package com.goalquest.identity.controller;

import com.goalquest.identity.dto.*;
import com.goalquest.identity.service.AuditLogService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
@Tag(name = "Auditoría")
public class AuditController {

        private final AuditLogService auditLogService;

        @Operation(summary = "Consultar logs de auditoría", description = """
                        Retorna los registros de auditoría del sistema con filtros opcionales.

                        **Solo accesible para usuarios con rol ADMIN.**

                        **Filtros disponibles:**
                        - `user_id`: Filtrar por UUID de usuario específico
                        - `action`: Filtrar por tipo de acción (LOGIN, LOGOUT, DELETE_GOAL, etc.)
                        - `from` / `to`: Rango de fechas en formato ISO 8601

                        Los resultados se ordenan por fecha de creación descendente (más recientes primero).
                        """, operationId = "IS-09")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lista paginada de logs de auditoría"),
                        @ApiResponse(responseCode = "401", description = "Token inválido o expirado", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
                        @ApiResponse(responseCode = "403", description = "No tiene permisos de administrador", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = """
                                        {
                                            "statusCode": 403,
                                            "error": "FORBIDDEN",
                                            "message": "No tiene permisos de administrador"
                                        }
                                        """)))
        })
        @SecurityRequirement(name = "bearer-jwt")
        @GetMapping("/logs")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<PaginatedResponseDTO<AuditLogDTO>> getLogs(
                        @Parameter(description = "UUID del usuario", example = "d3aea65d-6c5c-45c0-b925-4554601b6dcd") @RequestParam(required = false) String user_id,
                        @Parameter(description = "Tipo de acción", example = "LOGIN") @RequestParam(required = false) String action,
                        @Parameter(description = "Fecha inicio (ISO 8601)", example = "2025-01-01T00:00:00") @RequestParam(required = false) String from,
                        @Parameter(description = "Fecha fin (ISO 8601)", example = "2025-12-31T23:59:59") @RequestParam(required = false) String to,
                        @Parameter(description = "Número de página", example = "1") @RequestParam(defaultValue = "1") int page,
                        @Parameter(description = "Resultados por página", example = "50") @RequestParam(defaultValue = "50") int limit) {

                PaginatedResponseDTO<AuditLogDTO> result = auditLogService.getLogs(user_id, action, from, to, page,
                                limit);
                return ResponseEntity.ok(result);
        }

        @Operation(summary = "Registrar log de auditoría (uso interno)", description = """
                        Registra un nuevo evento en el log de auditoría.

                        **Endpoint interno** — Solo para comunicación entre microservicios.
                        Requiere el header `X-Internal-Service-Key` con la clave secreta compartida.

                        Utilizado por `task-service` al eliminar metas o tareas para registrar
                        la acción en el sistema de auditoría centralizado.
                        """, operationId = "IS-10")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Log registrado exitosamente", content = @Content(examples = @ExampleObject(value = """
                                        {
                                            "id": 42,
                                            "message": "Log de auditoría registrado exitosamente"
                                        }
                                        """))),
                        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
                        @ApiResponse(responseCode = "401", description = "Clave de servicio interno inválida o ausente", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
        })
        @SecurityRequirement(name = "internal-key")
        @PostMapping("/logs")
        public ResponseEntity<Map<String, Object>> createLog(
                        @Valid @RequestBody AuditLogRequestDTO dto) {
                AuditLogDTO created = auditLogService.createFromRequest(dto);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(Map.of(
                                                "id", created.getId(),
                                                "message", "Log de auditoría registrado exitosamente"));
        }
}
