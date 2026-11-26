// File: backend/src/main/java/com/resolveit/backend/dto/UpdateTicketStatusRequest.java
package com.resolveit.backend.dto;

import com.resolveit.backend.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTicketStatusRequest(
        @NotNull(message = "Status is required")
        TicketStatus status,
        String resolutionNote
) {}