package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goalquest.identity.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicUserDTO {

    private String id;
    private String name;

    @JsonProperty("avatar_url")
    private String avatarUrl;

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
