package com.resolveit.backend.repository;

import com.resolveit.backend.entity.Notification;
import com.resolveit.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop25ByRecipientOrderByCreatedAtDesc(User recipient);
    long countByRecipientAndIsReadFalse(User recipient);
}