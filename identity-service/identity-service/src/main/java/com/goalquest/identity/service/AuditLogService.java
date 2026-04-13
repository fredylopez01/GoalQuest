package com.goalquest.identity.service;

import com.goalquest.identity.dto.AuditLogDTO;
import com.goalquest.identity.dto.AuditLogRequestDTO;
import com.goalquest.identity.dto.PaginatedResponseDTO;
import com.goalquest.identity.entity.AuditLog;
import com.goalquest.identity.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(UUID userId, String action, String description, String ipAddress) {
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .action(action)
                .description(description)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(auditLog);
    }

    public AuditLogDTO createFromRequest(AuditLogRequestDTO dto) {
        AuditLog auditLog = AuditLog.builder()
                .userId(UUID.fromString(dto.getUserId()))
                .action(dto.getAction())
                .description(dto.getDescription())
                .ipAddress(dto.getIpAddress())
                .build();
        return AuditLogDTO.fromEntity(auditLogRepository.save(auditLog));
    }

    public PaginatedResponseDTO<AuditLogDTO> getLogs(
            String userIdStr,
            String action,
            String from,
            String to,
            int page,
            int limit) {

        String userId    = (userIdStr != null && !userIdStr.isBlank()) ? userIdStr : null;
        String actionF   = (action != null && !action.isBlank()) ? action : null;
        String fromDate  = (from != null && !from.isBlank()) ? from : null;
        String toDate    = (to != null && !to.isBlank()) ? to : null;

        long offset = (long) (page - 1) * limit;

        List<AuditLog> logs = auditLogRepository.filterLogsNative(userId, actionF, fromDate, toDate, limit, offset);
        long total = auditLogRepository.countFilterLogs(userId, actionF, fromDate, toDate);

        return PaginatedResponseDTO.<AuditLogDTO>builder()
                .data(logs.stream().map(AuditLogDTO::fromEntity).toList())
                .pagination(PaginatedResponseDTO.PaginationDTO.builder()
                        .page(page)
                        .limit(limit)
                        .total(total)
                        .build())
                .build();
    }
}
