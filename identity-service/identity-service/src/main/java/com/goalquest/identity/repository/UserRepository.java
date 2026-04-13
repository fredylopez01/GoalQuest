package com.goalquest.identity.repository;

import com.goalquest.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

       Optional<User> findByEmail(String email);

       boolean existsByEmail(String email);

       @Query(value = "SELECT * FROM users u WHERE " +
                     "(:search IS NULL OR " +
                     "LOWER(u.name) LIKE LOWER(CONCAT('%', CAST(:search AS VARCHAR), '%')) OR " +
                     "LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS VARCHAR), '%'))) " +
                     "ORDER BY u.name " +
                     "LIMIT :limit OFFSET :offset", nativeQuery = true)
       List<User> searchUsersNative(@Param("search") String search,
                     @Param("limit") int limit,
                     @Param("offset") long offset);

       @Query(value = "SELECT COUNT(*) FROM users u WHERE " +
                     "(:search IS NULL OR " +
                     "LOWER(u.name) LIKE LOWER(CONCAT('%', CAST(:search AS VARCHAR), '%')) OR " +
                     "LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS VARCHAR), '%')))", nativeQuery = true)
       long countSearchUsers(@Param("search") String search);
}
