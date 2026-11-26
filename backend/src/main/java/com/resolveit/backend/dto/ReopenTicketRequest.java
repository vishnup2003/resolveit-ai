// File: backend/src/main/java/com/resolveit/backend/dto/ReopenTicketRequest.java
package com.resolveit.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ReopenTicketRequest(
        @NotBlank(message = "Reason is required to reopen ticket")
        String reason
) {}