package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goalquest.identity.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
@Builder
@Schema(description = "Información completa del usuario")
public class UserDTO {

    @Schema(description = "Identificador único (UUID)", example = "d3aea65d-6c5c-45c0-b925-4554601b6dcd")
    private String id;

    @Schema(description = "Nombre del usuario", example = "Juan Pérez")
    private String name;

    @Schema(description = "Email del usuario", example = "juan@example.com")
    private String email;

    @Schema(description = "Rol del usuario en el sistema", example = "USER", allowableValues = { "USER", "ADMIN" })
    private String rol;

    @Schema(description = "URL de la imagen de perfil", example = "https://example.com/avatar.jpg", nullable = true)
    @JsonProperty("avatar_url")
    private String avatarUrl;

    @Schema(description = "Fecha de creación de la cuenta (ISO 8601)", example = "2025-04-14T10:30:00")
    @JsonProperty("created_at")
    private String createdAt;

    public static UserDTO fromEntity(User user) {
        return UserDTO.builder()
                .id(user.getId().toString())
                .name(user.getName())
                .email(user.getEmail())
                .rol(user.getRol())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                .build();
    }
}