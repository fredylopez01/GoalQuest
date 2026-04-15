package com.goalquest.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@Schema(description = "Respuesta paginada genérica")
public class PaginatedResponseDTO<T> {

    @Schema(description = "Lista de elementos de la página actual")
    private List<T> data;

    @Schema(description = "Información de paginación")
    private PaginationDTO pagination;

    @Data
    @Builder
    @Schema(description = "Metadatos de paginación")
    public static class PaginationDTO {
        @Schema(description = "Página actual", example = "1")
        private int page;

        @Schema(description = "Elementos por página", example = "20")
        private int limit;

        @Schema(description = "Total de elementos", example = "150")
        private long total;
    }
}