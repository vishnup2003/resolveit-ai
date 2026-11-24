package com.resolveit.backend.dto;

import com.resolveit.backend.enums.Role;
import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String authorName,
        Role authorRole,
        String message,
        LocalDateTime createdAt
) {}