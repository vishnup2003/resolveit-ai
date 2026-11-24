package com.resolveit.backend.service;

import com.resolveit.backend.entity.Ticket;
import com.resolveit.backend.enums.TicketStatus;
import com.resolveit.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaSchedulerService {

    private final TicketRepository ticketRepository;

    // Har 60 seconds mein check karega ki koi active ticket SLA deadline cross toh nahi kar gaya
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void escalateBreachedTickets() {
        List<TicketStatus> activeStatuses = List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS);
        List<Ticket> overdueTickets = ticketRepository.findByStatusInAndSlaDeadlineBefore(
                activeStatuses, LocalDateTime.now()
        );

        if (!overdueTickets.isEmpty()) {
            overdueTickets.forEach(ticket -> {
                ticket.setStatus(TicketStatus.ESCALATED);
                log.warn("SLA BREACHED! Escalating ticket: {}", ticket.getTicketNumber());
            });
            ticketRepository.saveAll(overdueTickets);
        }
    }
}