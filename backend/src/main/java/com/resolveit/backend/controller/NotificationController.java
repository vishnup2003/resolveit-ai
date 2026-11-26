package com.resolveit.backend.controller;

import com.resolveit.backend.dto.NotificationResponse;
import com.resolveit.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app user alerts for ticket updates and resolutions")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.getMyNotifications(auth.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(auth.getName())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, Authentication auth) {
        notificationService.markAsRead(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        notificationService.markAllAsRead(auth.getName());
        return ResponseEntity.ok().build();
    }
}