// File: backend/src/main/java/com/resolveit/backend/dto/TicketResponse.java
package com.resolveit.backend.dto;

import com.resolveit.backend.enums.TicketPriority;
import com.resolveit.backend.enums.TicketStatus;
import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        String ticketNumber,
        String title,
        String description,
        String errorLog,
        String category,
        TicketPriority priority,
        TicketStatus status,
        LocalDateTime slaDeadline,
        String resolutionNote,
        LocalDateTime resolvedAt,
        String reopenReason,
        String createdByName,
        String createdByEmail,
        String assignedToName,
        String assignedToEmail,
        AiInsightResponse aiInsight,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}