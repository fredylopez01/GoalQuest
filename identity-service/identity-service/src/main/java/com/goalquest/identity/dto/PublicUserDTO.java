package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goalquest.identity.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Información pública de un usuario (sin datos sensibles)")
public class PublicUserDTO {

    @Schema(description = "UUID del usuario", example = "d3aea65d-6c5c-45c0-b925-4554601b6dcd")
    private String id;

    @Schema(description = "Nombre del usuario", example = "Juan Pérez")
    private String name;

    @Schema(description = "URL del avatar", example = "https://example.com/avatar.jpg", nullable = true)
    @JsonProperty("avatar_url")
    private String avatarUrl;

    @Schema(description = "Rol del usuario", example = "USER")
    private String rol;

    public static PublicUserDTO fromEntity(User user) {
        return PublicUserDTO.builder()
                .id(user.getId().toString())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .rol(user.getRol())
                .build();
    }
}