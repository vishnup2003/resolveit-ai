package com.resolveit.backend.controller;

import com.resolveit.backend.dto.EngineerSummary;
import com.resolveit.backend.dto.TicketResponse;
import com.resolveit.backend.enums.Role;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Operations", description = "Admin-only endpoints for all tickets, engineers list, and reassignment")
public class AdminController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    @GetMapping("/tickets")
    @Operation(summary = "View all tickets across the organization")
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/engineers")
    @Operation(summary = "List all registered IT support engineers")
    public ResponseEntity<List<EngineerSummary>> getAllEngineers() {
        List<EngineerSummary> engineers = userRepository.findByRole(Role.ENGINEER)
                .stream()
                .map(u -> new EngineerSummary(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getDepartment() != null ? u.getDepartment() : "IT"
                ))
                .toList();
        return ResponseEntity.ok(engineers);
    }

    @PatchMapping("/tickets/{ticketId}/assign/{engineerId}")
    @Operation(summary = "Reassign a ticket to a specific engineer")
    public ResponseEntity<TicketResponse> reassignTicket(
            @PathVariable Long ticketId,
            @PathVariable Long engineerId) {
        return ResponseEntity.ok(ticketService.reassignTicket(ticketId, engineerId));
    }
}