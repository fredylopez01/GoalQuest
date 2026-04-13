package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goalquest.identity.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
@Builder
public class UserDTO {

    private String id;
    private String name;
    private String email;
    private String rol;

    @JsonProperty("avatar_url")
    private String avatarUrl;

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
