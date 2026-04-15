package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Campos editables del perfil de usuario (actualización parcial)")
public class ProfileUpdateDTO {

    @Schema(description = "Nuevo nombre del usuario", example = "Juan Carlos Pérez", nullable = true, minLength = 2, maxLength = 100)
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String name;

    @Schema(description = "Nueva URL de imagen de perfil", example = "https://example.com/new-avatar.jpg", nullable = true)
    @JsonProperty("avatar_url")
    private String avatarUrl;
}