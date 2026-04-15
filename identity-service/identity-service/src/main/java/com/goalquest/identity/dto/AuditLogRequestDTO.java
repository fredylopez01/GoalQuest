package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Datos para registrar un nuevo log de auditoría (uso interno entre microservicios)")
public class AuditLogRequestDTO {

    @Schema(description = "UUID del usuario que realizó la acción", example = "d3aea65d-6c5c-45c0-b925-4554601b6dcd")
    @NotNull(message = "El user_id es requerido")
    @JsonProperty("user_id")
    private String userId;

    @Schema(description = "Tipo de acción", example = "DELETE_GOAL")
    @NotBlank(message = "La acción es requerida")
    private String action;

    @Schema(description = "Descripción detallada", example = "Usuario eliminó la meta 'Aprender inglés' (ID: 15)")
    @NotBlank(message = "La descripción es requerida")
    private String description;

    @Schema(description = "IP del cliente original", example = "192.168.1.1", nullable = true)
    @JsonProperty("ip_address")
    private String ipAddress;
}