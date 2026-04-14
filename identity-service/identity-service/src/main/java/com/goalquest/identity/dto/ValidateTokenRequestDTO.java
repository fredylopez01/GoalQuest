package com.goalquest.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ValidateTokenRequestDTO {

    @NotBlank(message = "El token es requerido")
    private String token;
}
