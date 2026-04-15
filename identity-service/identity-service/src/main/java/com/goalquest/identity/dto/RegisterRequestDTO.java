package com.goalquest.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Datos requeridos para registrar un nuevo usuario")
public class RegisterRequestDTO {

    @Schema(description = "Nombre completo del usuario", example = "Juan Pérez", minLength = 2, maxLength = 100)
    @NotBlank(message = "El nombre es requerido")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String name;

    @Schema(description = "Dirección de correo electrónico (debe ser única)", example = "juan@example.com")
    @NotBlank(message = "El email es requerido")
    @Email(message = "Formato de email inválido")
    private String email;

    @Schema(description = "Contraseña (mínimo 8 caracteres)", example = "MiPassword123!", minLength = 8)
    @NotBlank(message = "La contraseña es requerida")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;
}