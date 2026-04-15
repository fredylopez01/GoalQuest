package com.goalquest.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Credenciales para iniciar sesión")
public class LoginRequestDTO {

    @Schema(description = "Email del usuario registrado", example = "juan@example.com")
    @NotBlank(message = "El email es requerido")
    @Email(message = "Formato de email inválido")
    private String email;

    @Schema(description = "Contraseña del usuario", example = "MiPassword123!")
    @NotBlank(message = "La contraseña es requerida")
    private String password;
}