package com.goalquest.identity.controller;

import com.goalquest.identity.dto.AuditLogDTO;
import com.goalquest.identity.dto.AuditLogRequestDTO;
import com.goalquest.identity.dto.PaginatedResponseDTO;
import com.goalquest.identity.service.AuditLogService;
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
public class AuditController {

    private final AuditLogService auditLogService;

    /**
     * IS-09 | GET /audit/logs
     * Obtener logs de auditoría. Solo ADMIN.
     * Protegido por JWT + rol ADMIN (SecurityConfig).
     */
    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponseDTO<AuditLogDTO>> getLogs(
            @RequestParam(required = false) String user_id,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit) {

        PaginatedResponseDTO<AuditLogDTO> result =
                auditLogService.getLogs(user_id, action, from, to, page, limit);
        return ResponseEntity.ok(result);
    }

    /**
     * IS-10 | POST /audit/logs
     * Registrar un log de auditoría. Uso interno.
     * Protegido por X-Internal-Service-Key (InternalServiceKeyFilter).
     */
    @PostMapping("/logs")
    public ResponseEntity<Map<String, Object>> createLog(
            @Valid @RequestBody AuditLogRequestDTO dto) {
        AuditLogDTO created = auditLogService.createFromRequest(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "id", created.getId(),
                        "message", "Log de auditoría registrado exitosamente"
                ));
    }
}
