package com.resolveit.backend.dto;

import java.time.LocalDateTime;

public record AiInsightResponse(
        String suggestedCategory,
        String suggestedPriority,
        String rootCauseSummary,
        String recommendedSteps,
        LocalDateTime generatedAt
) {}