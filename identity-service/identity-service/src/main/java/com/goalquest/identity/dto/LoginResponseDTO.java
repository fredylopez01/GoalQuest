package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Respuesta exitosa de login con token JWT y datos del usuario")
public class LoginResponseDTO {

    @Schema(description = "Token JWT para autenticación", example = "eyJhbGciOiJIUzI1NiJ9...")
    @JsonProperty("access_token")
    private String accessToken;

    @Schema(description = "Tipo de token", example = "Bearer")
    @JsonProperty("token_type")
    private String tokenType;

    @Schema(description = "Tiempo de expiración en segundos", example = "86400")
    @JsonProperty("expires_in")
    private int expiresIn;

    @Schema(description = "Datos del usuario autenticado")
    private UserDTO user;
}