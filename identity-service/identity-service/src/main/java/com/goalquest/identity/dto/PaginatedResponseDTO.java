package com.goalquest.identity.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PaginatedResponseDTO<T> {

    private List<T> data;
    private PaginationDTO pagination;

    @Data
    @Builder
    public static class PaginationDTO {
        private int page;
        private int limit;
        private long total;
    }
}
