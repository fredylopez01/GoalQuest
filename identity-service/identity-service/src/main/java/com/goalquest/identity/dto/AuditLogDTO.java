package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goalquest.identity.entity.AuditLog;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
@Builder
@Schema(description = "Registro de auditoría del sistema")
public class AuditLogDTO {

    @Schema(description = "ID del registro", example = "42")
    private Long id;

    @Schema(description = "UUID del usuario que realizó la acción", example = "d3aea65d-6c5c-45c0-b925-4554601b6dcd")
    @JsonProperty("user_id")
    private String userId;

    @Schema(description = "Tipo de acción registrada", example = "LOGIN")
    private String action;

    @Schema(description = "Descripción detallada de la acción", example = "Usuario inició sesión desde 192.168.1.1")
    private String description;

    @Schema(description = "Dirección IP del cliente", example = "192.168.1.1", nullable = true)
    @JsonProperty("ip_address")
    private String ipAddress;

    @Schema(description = "Fecha y hora del evento (ISO 8601)", example = "2025-04-14T10:30:00")
    @JsonProperty("created_at")
    private String createdAt;

    public static AuditLogDTO fromEntity(AuditLog log) {
        return AuditLogDTO.builder()
                .id(log.getId())
                .userId(log.getUserId().toString())
                .action(log.getAction())
                .description(log.getDescription())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                .build();
    }
}