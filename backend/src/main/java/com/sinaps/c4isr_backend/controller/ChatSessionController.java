package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.ChatMessage;
import com.sinaps.c4isr_backend.model.ChatSession;
import com.sinaps.c4isr_backend.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * Chat Sessions Controller — Persistent Multi-Session AI Chat
 * ============================================================================
 *
 * Endpoints:
 *   POST   /api/v1/chats                        → Create new empty session
 *   GET    /api/v1/chats                         → List all sessions (ordered by updated_at DESC)
 *   DELETE /api/v1/chats/{sessionId}             → Delete a session and its messages
 *   GET    /api/v1/chats/{sessionId}/messages    → Get all messages for a session
 *   POST   /api/v1/chats/{sessionId}/messages    → Send a message (user→AI→save both)
 *
 * ============================================================================
 */
@Tag(
    name = "Chat Sessions",
    description = "Kalıcı çoklu sohbet oturumu yönetimi. Kullanıcı mesajı + AI cevabı DB'de saklanır; oturum başlığı ilk mesaja göre otomatik oluşur."
)
@RestController
@RequestMapping("/api/v1/chats")
public class ChatSessionController {

    private static final Logger log = LoggerFactory.getLogger(ChatSessionController.class);

    private final ChatService chatService;

    public ChatSessionController(ChatService chatService) {
        this.chatService = chatService;
    }

    // ── Session CRUD ─────────────────────────────────────────────────

    /**
     * POST /api/v1/chats
     * Create a new empty chat session.
     */
    @Operation(summary = "Yeni boş chat oturumu oluştur")
    @PostMapping
    public ResponseEntity<ChatSession> createSession() {
        ChatSession session = chatService.createSession();
        return ResponseEntity.ok(session);
    }

    /**
     * GET /api/v1/chats
     * List all sessions, most recently updated first.
     */
    @Operation(summary = "Tüm chat oturumlarını listele (en son güncellenen ilk)")
    @GetMapping
    public ResponseEntity<List<ChatSession>> getAllSessions() {
        List<ChatSession> sessions = chatService.getAllSessions();
        return ResponseEntity.ok(sessions);
    }

    /**
     * DELETE /api/v1/chats/{sessionId}
     * Delete a session and all its messages.
     */
    @Operation(summary = "Oturumu ve tüm mesajlarını sil")
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long sessionId) {
        chatService.deleteSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    // ── Messages ─────────────────────────────────────────────────────

    /**
     * GET /api/v1/chats/{sessionId}/messages
     * Fetch all messages in a session, sorted chronologically.
     */
    @Operation(summary = "Oturumun tüm mesajlarını kronolojik döner")
    @GetMapping("/{sessionId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable Long sessionId) {
        List<ChatMessage> messages = chatService.getMessages(sessionId);
        return ResponseEntity.ok(messages);
    }

    /**
     * POST /api/v1/chats/{sessionId}/messages
     *
     * Full pipeline:
     *   1. Saves user message to DB
     *   2. Forwards query to Python AI service (/chat)
     *   3. Saves AI response to DB
     *   4. Auto-titles session on first user message
     *   5. Returns the AI's ChatMessage object
     *
     * Request body: { "content": "İHA bataryası ne zaman kritik olur?" }
     */
    @Operation(
        summary = "Mesaj gönder (user → AI → kaydet)",
        description = "Tam pipeline: kullanıcı mesajını kaydet → Python AI servisine ilet → AI yanıtını kaydet → " +
                      "ilk mesajda oturum başlığını otomatik oluştur → AI mesajını döndür. Body: `{ \"content\": \"...\" }`"
    )
    @PostMapping("/{sessionId}/messages")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> body
    ) {
        String content = body.get("content");

        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Mesaj içeriği boş olamaz.")
            );
        }

        log.info("Chat message received: sessionId={}, content={}", sessionId,
                content.length() > 80 ? content.substring(0, 80) + "..." : content);

        try {
            ChatMessage aiMessage = chatService.sendMessage(sessionId, content.trim());
            return ResponseEntity.ok(aiMessage);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Chat message processing failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Mesaj işlenirken hata oluştu: " + e.getMessage())
            );
        }
    }
}
