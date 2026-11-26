package com.resolveit.backend.controller;

import com.resolveit.backend.dto.*;
import com.resolveit.backend.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets & AI Triage", description = "Create tickets with AI triage, manage status, and post comments")
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Create a new support ticket (Employees only)")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication) {
        TicketResponse response = ticketService.createTicket(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(Authentication authentication) {
        return ResponseEntity.ok(ticketService.getMyCreatedTickets(authentication.getName()));
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('ENGINEER', 'ADMIN')")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(Authentication authentication) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ENGINEER', 'ADMIN')")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                ticketService.updateTicketStatus(id, request.status(), request.resolutionNote(), authentication.getName())
        );
    }

    @PatchMapping("/{id}/reopen")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<TicketResponse> reopenTicket(
            @PathVariable Long id,
            @Valid @RequestBody ReopenTicketRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ticketService.reopenTicket(id, request.reason(), authentication.getName()));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, request, authentication.getName()));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getComments(id));
    }
}