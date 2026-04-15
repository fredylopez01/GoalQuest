package com.goalquest.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Token JWT a validar")
public class ValidateTokenRequestDTO {

    @Schema(description = "Token JWT completo", example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkM2FlYTY1ZC...")
    @NotBlank(message = "El token es requerido")
    private String token;
}