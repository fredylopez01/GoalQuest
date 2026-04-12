package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ValidateTokenResponseDTO {

    private boolean valid;

    @JsonProperty("user_id")
    private String userId;

    private String email;
    private String rol;
}
