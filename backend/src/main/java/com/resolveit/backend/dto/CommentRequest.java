package com.resolveit.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
        @NotBlank(message = "Comment message cannot be empty")
        String message
) {}