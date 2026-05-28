package com.goalquest.identity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    /** Null para usuarios registrados con OAuth2 (no tienen contraseña local). */
    @Column(name = "hash_password", length = 255)
    private String hashPassword;

    @Column(name = "rol", length = 20)
    @Builder.Default
    private String rol = "USER";

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /** Proveedor OAuth2: "google", "github", etc. Null para cuentas locales. */
    @Column(name = "oauth2_provider", length = 50)
    private String oauth2Provider;

    /** ID del usuario en el proveedor OAuth2. */
    @Column(name = "oauth2_id", length = 255)
    private String oauth2Id;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
