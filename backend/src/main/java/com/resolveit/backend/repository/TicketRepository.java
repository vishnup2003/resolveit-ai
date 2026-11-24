package com.resolveit.backend.repository;

import com.resolveit.backend.entity.Ticket;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    List<Ticket> findByCreatedByOrderByCreatedAtDesc(User createdBy);

    List<Ticket> findByAssignedToOrderByCreatedAtDesc(User assignedTo);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    long countByAssignedToAndStatusIn(User assignedTo, List<TicketStatus> statuses);

    List<Ticket> findByStatusInAndSlaDeadlineBefore(List<TicketStatus> statuses, LocalDateTime now);
}