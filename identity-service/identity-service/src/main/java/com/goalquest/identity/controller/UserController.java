package com.goalquest.identity.controller;

import com.goalquest.identity.dto.PaginatedResponseDTO;
import com.goalquest.identity.dto.ProfileUpdateDTO;
import com.goalquest.identity.dto.PublicUserDTO;
import com.goalquest.identity.dto.UserDTO;
import com.goalquest.identity.entity.User;
import com.goalquest.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * IS-05 | GET /users/profile
     * Obtener perfil del usuario autenticado.
     */
    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getMyProfile(@AuthenticationPrincipal User user) {
        UserDTO dto = userService.getProfile(user.getId());
        return ResponseEntity.ok(dto);
    }

    /**
     * IS-06 | PATCH /users/profile
     * Editar perfil del usuario autenticado.
     */
    @PatchMapping("/profile")
    public ResponseEntity<UserDTO> updateMyProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProfileUpdateDTO dto) {
        UserDTO updated = userService.updateProfile(user.getId(), dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * IS-07 | GET /users/{userId}
     * Obtener información pública de un usuario por ID.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<PublicUserDTO> getUserById(@PathVariable UUID userId) {
        PublicUserDTO dto = userService.getPublicUserById(userId);
        return ResponseEntity.ok(dto);
    }

    /**
     * IS-08 | GET /users
     * Buscar/listar usuarios con paginación y filtro opcional por nombre o email.
     */
    @GetMapping
    public ResponseEntity<PaginatedResponseDTO<UserDTO>> searchUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        PaginatedResponseDTO<UserDTO> result = userService.searchUsers(search, page, limit);
        return ResponseEntity.ok(result);
    }
}
