package com.resolveit.backend.service;

import com.resolveit.backend.dto.*;
import com.resolveit.backend.entity.AiInsight;
import com.resolveit.backend.entity.Ticket;
import com.resolveit.backend.entity.TicketComment;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.enums.Role;
import com.resolveit.backend.enums.TicketPriority;
import com.resolveit.backend.enums.TicketStatus;
import com.resolveit.backend.exception.BadRequestException;
import com.resolveit.backend.exception.ResourceNotFoundException;
import com.resolveit.backend.repository.TicketCommentRepository;
import com.resolveit.backend.repository.TicketRepository;
import com.resolveit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TicketCommentRepository commentRepository;
    private final AiTriageService aiTriageService;

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String ticketNumber = "RIT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Ticket ticket = Ticket.builder()
                .ticketNumber(ticketNumber)
                .title(request.title())
                .description(request.description())
                .errorLog(request.errorLog())
                .category(request.category() != null && !request.category().isBlank() ? request.category() : "Pending")
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .createdBy(creator)
                .build();

        // 1. Run AI Triage Analysis
        AiInsight insight = aiTriageService.analyzeTicket(ticket);
        ticket.setAiInsight(insight);

        // Apply AI category if user left category blank
        if (request.category() == null || request.category().isBlank()) {
            ticket.setCategory(insight.getSuggestedCategory());
        }

        // Apply AI Priority & calculate SLA Deadline
        TicketPriority priority = TicketPriority.valueOf(insight.getSuggestedPriority());
        ticket.setPriority(priority);
        ticket.setSlaDeadline(calculateSlaDeadline(priority));

        // 2. Auto-assign to Engineer with lowest active workload
        User bestEngineer = findLeastBusyEngineer();
        if (bestEngineer != null) {
            ticket.setAssignedTo(bestEngineer);
        }

        Ticket saved = ticketRepository.save(ticket);
        return mapToResponse(saved);
    }

    public List<TicketResponse> getMyCreatedTickets(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ticketRepository.findByCreatedByOrderByCreatedAtDesc(user)
                .stream().map(this::mapToResponse).toList();
    }

    public List<TicketResponse> getAssignedTickets(String engineerEmail) {
        User engineer = userRepository.findByEmail(engineerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Engineer not found"));
        return ticketRepository.findByAssignedToOrderByCreatedAtDesc(engineer)
                .stream().map(this::mapToResponse).toList();
    }

    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).toList();
    }

    public TicketResponse getTicketById(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        return mapToResponse(ticket);
    }

    @Transactional
    public TicketResponse updateTicketStatus(Long ticketId, TicketStatus newStatus) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        ticket.setStatus(newStatus);
        return mapToResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse reassignTicket(Long ticketId, Long engineerId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        User engineer = userRepository.findById(engineerId)
                .orElseThrow(() -> new ResourceNotFoundException("Engineer not found with id: " + engineerId));

        if (engineer.getRole() != Role.ENGINEER) {
            throw new BadRequestException("Target user must have ENGINEER role");
        }

        ticket.setAssignedTo(engineer);
        return mapToResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public CommentResponse addComment(Long ticketId, CommentRequest request, String authorEmail) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .message(request.message())
                .build();

        TicketComment saved = commentRepository.save(comment);
        return new CommentResponse(
                saved.getId(),
                author.getName(),
                author.getRole(),
                saved.getMessage(),
                saved.getCreatedAt()
        );
    }

    public List<CommentResponse> getComments(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(c -> new CommentResponse(
                        c.getId(),
                        c.getAuthor().getName(),
                        c.getAuthor().getRole(),
                        c.getMessage(),
                        c.getCreatedAt()
                ))
                .toList();
    }

    private User findLeastBusyEngineer() {
        List<User> engineers = userRepository.findByRole(Role.ENGINEER);
        if (engineers.isEmpty()) {
            return null;
        }
        List<TicketStatus> activeStatuses = List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED);
        return engineers.stream()
                .min(Comparator.comparingLong(eng -> ticketRepository.countByAssignedToAndStatusIn(eng, activeStatuses)))
                .orElse(engineers.get(0));
    }

    private LocalDateTime calculateSlaDeadline(TicketPriority priority) {
        LocalDateTime now = LocalDateTime.now();
        return switch (priority) {
            case CRITICAL -> now.plusHours(2);
            case HIGH -> now.plusHours(6);
            case MEDIUM -> now.plusHours(24);
            case LOW -> now.plusHours(48);
        };
    }

    private TicketResponse mapToResponse(Ticket t) {
        AiInsightResponse insightDto = null;
        if (t.getAiInsight() != null) {
            AiInsight ai = t.getAiInsight();
            insightDto = new AiInsightResponse(
                    ai.getSuggestedCategory(),
                    ai.getSuggestedPriority(),
                    ai.getRootCauseSummary(),
                    ai.getRecommendedSteps(),
                    ai.getGeneratedAt()
            );
        }

        return new TicketResponse(
                t.getId(),
                t.getTicketNumber(),
                t.getTitle(),
                t.getDescription(),
                t.getErrorLog(),
                t.getCategory(),
                t.getPriority(),
                t.getStatus(),
                t.getSlaDeadline(),
                t.getCreatedBy().getName(),
                t.getCreatedBy().getEmail(),
                t.getAssignedTo() != null ? t.getAssignedTo().getName() : "Unassigned",
                t.getAssignedTo() != null ? t.getAssignedTo().getEmail() : null,
                insightDto,
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}