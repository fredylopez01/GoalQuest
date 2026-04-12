package com.goalquest.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goalquest.identity.entity.AuditLog;
import lombok.Builder;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
@Builder
public class AuditLogDTO {

    private Long id;

    @JsonProperty("user_id")
    private String userId;

    private String action;
    private String description;

    @JsonProperty("ip_address")
    private String ipAddress;

    @JsonProperty("created_at")
    private String createdAt;

    public static AuditLogDTO fromEntity(AuditLog log) {
        return AuditLogDTO.builder()
                .id(log.getId())
                .userId(log.getUserId().toString())
                .action(log.getAction())
                .description(log.getDescription())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                .build();
    }
}
