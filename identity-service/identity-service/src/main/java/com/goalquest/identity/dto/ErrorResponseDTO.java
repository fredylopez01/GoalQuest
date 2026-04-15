package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Formato estándar de error de la API")
public class ErrorResponseDTO {

    @Schema(description = "Código de estado HTTP", example = "400")
    @JsonProperty("statusCode")
    private int statusCode;

    @Schema(description = "Código de error", example = "VALIDATION_ERROR")
    private String error;

    @Schema(description = "Mensaje descriptivo del error (puede ser un string o un array de strings)", example = "El email ya está registrado")
    private Object message;
}