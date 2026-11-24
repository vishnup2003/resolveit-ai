package com.resolveit.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTicketRequest(
        @NotBlank(message = "Title is required")
        String title,

        @NotBlank(message = "Description is required")
        String description,

        String errorLog, // Optional stack trace
        String category  // Optional: agar user blank chhode toh AI khud detect karega!
) {}