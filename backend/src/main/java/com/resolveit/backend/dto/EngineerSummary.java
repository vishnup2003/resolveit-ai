package com.resolveit.backend.dto;

public record EngineerSummary(
        Long id,
        String name,
        String email,
        String department
) {}