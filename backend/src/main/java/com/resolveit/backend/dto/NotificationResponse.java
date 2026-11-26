package com.resolveit.backend.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        Long ticketId,
        String ticketNumber,
        boolean isRead,
        LocalDateTime createdAt
) {}