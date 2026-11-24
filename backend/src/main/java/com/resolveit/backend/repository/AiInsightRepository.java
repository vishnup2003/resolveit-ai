package com.resolveit.backend.repository;

import com.resolveit.backend.entity.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {

    Optional<AiInsight> findByTicketId(Long ticketId);
}