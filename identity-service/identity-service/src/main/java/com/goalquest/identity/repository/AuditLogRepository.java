package com.goalquest.identity.repository;

import com.goalquest.identity.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

       @Query(value = "SELECT * FROM audit_log a WHERE " +
                     "(:userId IS NULL OR a.user_id = CAST(:userId AS UUID)) AND " +
                     "(:action IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', CAST(:action AS VARCHAR), '%'))) AND "
                     +
                     "(:fromDate IS NULL OR a.created_at >= CAST(:fromDate AS TIMESTAMP)) AND " +
                     "(:toDate IS NULL OR a.created_at <= CAST(:toDate AS TIMESTAMP)) " +
                     "ORDER BY a.created_at DESC " +
                     "LIMIT :limit OFFSET :offset", nativeQuery = true)
       List<AuditLog> filterLogsNative(@Param("userId") String userId,
                     @Param("action") String action,
                     @Param("fromDate") String fromDate,
                     @Param("toDate") String toDate,
                     @Param("limit") int limit,
                     @Param("offset") long offset);

       @Query(value = "SELECT COUNT(*) FROM audit_log a WHERE " +
                     "(:userId IS NULL OR a.user_id = CAST(:userId AS UUID)) AND " +
                     "(:action IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', CAST(:action AS VARCHAR), '%'))) AND "
                     +
                     "(:fromDate IS NULL OR a.created_at >= CAST(:fromDate AS TIMESTAMP)) AND " +
                     "(:toDate IS NULL OR a.created_at <= CAST(:toDate AS TIMESTAMP))", nativeQuery = true)
       long countFilterLogs(@Param("userId") String userId,
                     @Param("action") String action,
                     @Param("fromDate") String fromDate,
                     @Param("toDate") String toDate);
}
