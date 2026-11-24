package com.resolveit.backend.dto;

import com.resolveit.backend.enums.Role;

public record AuthResponse(
        String token,
        Long userId,
        String name,
        String email,
        Role role,
        String department
) {}