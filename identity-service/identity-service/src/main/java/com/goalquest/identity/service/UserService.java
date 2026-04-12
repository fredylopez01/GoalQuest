package com.goalquest.identity.service;

import com.goalquest.identity.dto.PaginatedResponseDTO;
import com.goalquest.identity.dto.ProfileUpdateDTO;
import com.goalquest.identity.dto.PublicUserDTO;
import com.goalquest.identity.dto.UserDTO;
import com.goalquest.identity.entity.User;
import com.goalquest.identity.exception.UserNotFoundException;
import com.goalquest.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserDTO getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId.toString()));
        return UserDTO.fromEntity(user);
    }

    @Transactional
    public UserDTO updateProfile(UUID userId, ProfileUpdateDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId.toString()));

        if (dto.getName() != null && !dto.getName().isBlank()) {
            user.setName(dto.getName());
        }
        if (dto.getAvatarUrl() != null) {
            user.setAvatarUrl(dto.getAvatarUrl());
        }

        return UserDTO.fromEntity(userRepository.save(user));
    }

    public PublicUserDTO getPublicUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId.toString()));
        return PublicUserDTO.fromEntity(user);
    }

    public PaginatedResponseDTO<UserDTO> searchUsers(String search, int page, int limit) {
        String searchParam = (search != null && !search.isBlank()) ? search : null;
        long offset = (long) (page - 1) * limit;

        List<User> users = userRepository.searchUsersNative(searchParam, limit, offset);
        long total = userRepository.countSearchUsers(searchParam);

        return PaginatedResponseDTO.<UserDTO>builder()
                .data(users.stream().map(UserDTO::fromEntity).toList())
                .pagination(PaginatedResponseDTO.PaginationDTO.builder()
                        .page(page)
                        .limit(limit)
                        .total(total)
                        .build())
                .build();
    }
}
