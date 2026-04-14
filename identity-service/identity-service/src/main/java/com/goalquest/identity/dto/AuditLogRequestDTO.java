package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AuditLogRequestDTO {

    @NotNull(message = "El user_id es requerido")
    @JsonProperty("user_id")
    private String userId;

    @NotBlank(message = "La acción es requerida")
    private String action;

    @NotBlank(message = "La descripción es requerida")
    private String description;

    @JsonProperty("ip_address")
    private String ipAddress;
}
