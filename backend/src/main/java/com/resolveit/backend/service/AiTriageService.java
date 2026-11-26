package com.resolveit.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolveit.backend.entity.AiInsight;
import com.resolveit.backend.entity.Ticket;
import com.resolveit.backend.enums.TicketPriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTriageService {

    @Value("${GEMINI_API_KEY:${ai.gemini.api-key:}}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public AiInsight analyzeTicket(Ticket ticket) {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                log.info("Calling Gemini AI for ticket: {}", ticket.getTitle());
                return callGeminiApi(ticket);
            } catch (Exception e) {
                log.error("Gemini API call failed, switching to smart rule-based triage: {}", e.getMessage());
            }
        } else {
            log.warn("GEMINI_API_KEY is missing/empty; using rule-based triage.");
        }
        return runSmartFallbackTriage(ticket);
    }

    private AiInsight callGeminiApi(Ticket ticket) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey.trim();

        String prompt = """
                You are an expert L2/L3 IT Service Desk Triage AI. Analyze this support ticket and respond ONLY with valid raw JSON (no markdown, no backticks) with exact keys:
                {"category": "Network|Software|Hardware|Database|Access", "priority": "LOW|MEDIUM|HIGH|CRITICAL", "rootCause": "...", "steps": "1. ...\\n2. ...\\n3. ..."}

                Title: %s
                Description: %s
                Error Log: %s
                """.formatted(
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getErrorLog() != null ? ticket.getErrorLog() : "None provided"
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        String jsonPayload = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini HTTP " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String rawText = root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText().trim();

        rawText = rawText.replaceAll("^```json\\s*", "").replaceAll("^```\\s*", "").replaceAll("\\s*```$", "").trim();
        JsonNode aiJson = objectMapper.readTree(rawText);

        String category = aiJson.path("category").asText("Software");
        String priorityStr = aiJson.path("priority").asText("MEDIUM").toUpperCase();

        return AiInsight.builder()
                .ticket(ticket)
                .suggestedCategory(category)
                .suggestedPriority(validatePriority(priorityStr).name())
                .rootCauseSummary(aiJson.path("rootCause").asText("Automated AI root-cause assessment generated."))
                .recommendedSteps(aiJson.path("steps").asText("1. Reproduce issue.\n2. Inspect logs.\n3. Apply patch."))
                .build();
    }

    private AiInsight runSmartFallbackTriage(Ticket ticket) {
        String combined = (ticket.getTitle() + " " + ticket.getDescription() + " " +
                (ticket.getErrorLog() != null ? ticket.getErrorLog() : "")).toLowerCase();

        String category = "Software";
        TicketPriority priority = TicketPriority.MEDIUM;
        String rootCause;
        String steps;

        if (combined.contains("internet") || combined.contains("wifi") || combined.contains("vpn")
                || combined.contains("network") || combined.contains("timeout") || combined.contains("dns")
                || combined.contains("ethernet") || combined.contains("lan") || combined.contains("offline")
                || combined.contains("router")) {
            category = "Network";
            priority = combined.contains("production") || combined.contains("outage") ? TicketPriority.CRITICAL : TicketPriority.HIGH;
            rootCause = "Connectivity bottleneck, DNS resolution failure, or gateway/ISP session drop detected.";
            steps = "1. Check physical LAN/Wi-Fi adapter status and gateway ping.\n2. Flush local DNS cache (ipconfig /flushdns) and test external DNS (8.8.8.8).\n3. Verify VPN/proxy settings and firewall rules on ports 80/443.";
        } else if (combined.contains("database") || combined.contains("mysql") || combined.contains("sql") || combined.contains("connection refused") || combined.contains("deadlock")) {
            category = "Database";
            priority = TicketPriority.CRITICAL;
            rootCause = "Database connection pool exhaustion, service downtime, or credential/port mismatch on MySQL instance.";
            steps = "1. Confirm MySQL daemon status and port listener.\n2. Inspect HikariCP active connection pool metrics.\n3. Verify datasource credentials and restart service if hung.";
        } else if (combined.contains("access") || combined.contains("login") || combined.contains("401") || combined.contains("403") || combined.contains("permission") || combined.contains("password")) {
            category = "Access";
            priority = TicketPriority.HIGH;
            rootCause = "Expired authentication token, missing RBAC role mapping, or locked directory account.";
            steps = "1. Verify user role assignment in IAM directory.\n2. Clear stale session tokens and trigger password/MFA reset.\n3. Re-test endpoint authorization headers.";
        } else if (combined.contains("laptop") || combined.contains("screen") || combined.contains("battery") || combined.contains("keyboard") || combined.contains("hardware")) {
            category = "Hardware";
            priority = TicketPriority.MEDIUM;
            rootCause = "Physical peripheral degradation or local driver/firmware conflict on workstation.";
            steps = "1. Run OEM hardware diagnostics.\n2. Update BIOS and device drivers.\n3. Schedule desk-side replacement unit if fault persists.";
        } else if (combined.contains("nullpointer") || combined.contains("exception") || combined.contains("500") || combined.contains("crash")) {
            category = "Software";
            priority = TicketPriority.HIGH;
            rootCause = "Unhandled runtime exception in application service layer due to null reference or invalid payload.";
            steps = "1. Trace stack line number from attached error log.\n2. Add null-guard validation and reproduce locally.\n3. Deploy hotfix build and verify regression tests.";
        } else {
            rootCause = "General application workflow anomaly requiring log inspection and environment verification.";
            steps = "1. Gather exact reproduction steps and browser/OS version.\n2. Check application server logs for warning spikes.\n3. Escalate to L2 module owner if unresolved.";
        }

        return AiInsight.builder()
                .ticket(ticket)
                .suggestedCategory(category)
                .suggestedPriority(priority.name())
                .rootCauseSummary(rootCause)
                .recommendedSteps(steps)
                .build();
    }

    private TicketPriority validatePriority(String value) {
        try {
            return TicketPriority.valueOf(value);
        } catch (IllegalArgumentException e) {
            return TicketPriority.MEDIUM;
        }
    }
}