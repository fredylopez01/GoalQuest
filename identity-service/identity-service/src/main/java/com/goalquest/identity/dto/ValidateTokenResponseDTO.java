package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Resultado de la validación del token JWT")
public class ValidateTokenResponseDTO {

    @Schema(description = "Indica si el token es válido", example = "true")
    private boolean valid;

    @Schema(description = "UUID del usuario dueño del token", example = "d3aea65d-6c5c-45c0-b925-4554601b6dcd")
    @JsonProperty("user_id")
    private String userId;

    @Schema(description = "Email del usuario", example = "juan@example.com")
    private String email;

    @Schema(description = "Rol del usuario", example = "USER")
    private String rol;
}