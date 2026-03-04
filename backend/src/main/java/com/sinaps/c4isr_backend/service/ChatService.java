package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.client.AIServiceClient;
import com.sinaps.c4isr_backend.model.ChatMessage;
import com.sinaps.c4isr_backend.model.ChatSession;
import com.sinaps.c4isr_backend.repository.ChatMessageRepository;
import com.sinaps.c4isr_backend.repository.ChatSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * Chat Service — Orchestrates persistent, multi-session AI chat.
 * ============================================================================
 *
 * Flow for sending a message:
 *   1. Save the user's message to DB
 *   2. Auto-set session title if this is the first user message
 *   3. Forward query to Python AI Service (POST /chat)
 *   4. Save the AI's response (with cited_rule) to DB
 *   5. Touch session.updatedAt for correct ordering
 *   6. Return the saved AI ChatMessage entity
 *
 * ============================================================================
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final AIServiceClient aiServiceClient;

    public ChatService(
            ChatSessionRepository sessionRepo,
            ChatMessageRepository messageRepo,
            AIServiceClient aiServiceClient
    ) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
        this.aiServiceClient = aiServiceClient;
    }

    // ── Sessions ─────────────────────────────────────────────────────

    /** Create an empty new session. */
    @Transactional
    public ChatSession createSession() {
        ChatSession session = ChatSession.builder()
                .title("")
                .updatedAt(LocalDateTime.now())
                .build();
        ChatSession saved = sessionRepo.save(session);
        log.info("New chat session created: id={}", saved.getId());
        return saved;
    }

    /** Get all sessions, most-recently-updated first. */
    public List<ChatSession> getAllSessions() {
        return sessionRepo.findAllByOrderByUpdatedAtDesc();
    }

    /** Delete a session and all its messages (cascade). */
    @Transactional
    public void deleteSession(Long sessionId) {
        sessionRepo.deleteById(sessionId);
        log.info("Chat session deleted: id={}", sessionId);
    }

    // ── Messages ─────────────────────────────────────────────────────

    /** All messages for a session in chronological order. */
    public List<ChatMessage> getMessages(Long sessionId) {
        return messageRepo.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    /**
     * Full send-message pipeline:
     *   1. Persist user message
     *   2. Auto-title the session if first message
     *   3. Call Python AI service
     *   4. Persist AI response
     *   5. Touch session.updatedAt
     *   6. Return the AI's ChatMessage
     */
    @Transactional
    public ChatMessage sendMessage(Long sessionId, String userText) {
        // Validate session exists
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // 1. Save user message
        ChatMessage userMsg = ChatMessage.builder()
                .sessionId(sessionId)
                .role("user")
                .content(userText)
                .citedRule("")
                .build();
        messageRepo.save(userMsg);

        // 2. Auto-title from first user message (if title is blank)
        if (session.getTitle() == null || session.getTitle().isBlank()) {
            String autoTitle = userText.length() > 40
                    ? userText.substring(0, 40) + "..."
                    : userText;
            session.setTitle(autoTitle);
        }

        // 3. Call Python AI Service (blocking)
        String aiResponse;
        String citedRule = "";

        try {
            log.info("[Chat] Forwarding to AI service: sessionId={}, query={}",
                    sessionId, userText.length() > 80 ? userText.substring(0, 80) + "..." : userText);

            Map<String, Object> result = aiServiceClient.chatAsync(userText).block();

            if (result != null) {
                aiResponse = String.valueOf(result.getOrDefault("response", "AI yanıt üretemedi."));
                Object rule = result.get("cited_rule");
                citedRule = rule != null ? String.valueOf(rule) : "";
            } else {
                aiResponse = "AI servisi yanıt veremedi. Lütfen daha sonra tekrar deneyin.";
            }
        } catch (Exception e) {
            log.error("[Chat] AI service call failed: {}", e.getMessage());
            aiResponse = "AI servisi şu an erişilemez. Hata: " + e.getMessage();
        }

        // 4. Save AI response message
        ChatMessage aiMsg = ChatMessage.builder()
                .sessionId(sessionId)
                .role("assistant")
                .content(aiResponse)
                .citedRule(citedRule)
                .build();
        ChatMessage savedAiMsg = messageRepo.save(aiMsg);

        // 5. Touch session.updatedAt
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepo.save(session);

        log.info("[Chat] Message cycle complete: sessionId={}, aiResponseLen={}",
                sessionId, aiResponse.length());

        return savedAiMsg;
    }
}
