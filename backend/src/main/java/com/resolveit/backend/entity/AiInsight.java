package com.resolveit.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_insights")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false, unique = true)
    private Ticket ticket;

    private String suggestedCategory;

    private String suggestedPriority;

    @Column(columnDefinition = "TEXT")
    private String rootCauseSummary;

    @Column(columnDefinition = "TEXT")
    private String recommendedSteps;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime generatedAt;
}