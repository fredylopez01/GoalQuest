package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ErrorResponseDTO {

    @JsonProperty("statusCode")
    private int statusCode;

    private String error;
    private Object message;
}
