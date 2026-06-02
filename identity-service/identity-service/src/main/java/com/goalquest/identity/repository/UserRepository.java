package com.goalquest.identity.repository;

import com.goalquest.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    Page<User> findAll(Pageable pageable);

    /** Buscar usuario por proveedor OAuth2 y su ID en ese proveedor. */
    Optional<User> findByOauth2ProviderAndOauth2Id(String oauth2Provider, String oauth2Id);

    // ── Métodos originales de búsqueda paginada ──────────────────────────────

    @Query(value = """
            SELECT * FROM users
            WHERE LOWER(name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(email) LIKE LOWER(CONCAT('%', :search, '%'))
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<User> searchUsersNative(
            @Param("search") String search,
            @Param("limit") int limit,
            @Param("offset") long offset);

    @Query(value = """
            SELECT COUNT(*) FROM users
            WHERE LOWER(name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(email) LIKE LOWER(CONCAT('%', :search, '%'))
            """, nativeQuery = true)
    long countSearchUsers(@Param("search") String search);
}