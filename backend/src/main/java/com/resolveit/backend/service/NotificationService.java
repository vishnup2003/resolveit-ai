package com.resolveit.backend.service;

import com.resolveit.backend.dto.NotificationResponse;
import com.resolveit.backend.entity.Notification;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.exception.ResourceNotFoundException;
import com.resolveit.backend.repository.NotificationRepository;
import com.resolveit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void sendNotification(User recipient, String title, String message, Long ticketId, String ticketNumber) {
        if (recipient == null) return;
        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .ticketId(ticketId)
                .ticketNumber(ticketNumber)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getMyNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findTop25ByRecipientOrderByCreatedAtDesc(user)
                .stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getTitle(),
                        n.getMessage(),
                        n.getTicketId(),
                        n.getTicketNumber(),
                        n.isRead(),
                        n.getCreatedAt()
                ))
                .toList();
    }

    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long id, String email) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (notification.getRecipient().getEmail().equals(email)) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Notification> list = notificationRepository.findTop25ByRecipientOrderByCreatedAtDesc(user);
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }
}