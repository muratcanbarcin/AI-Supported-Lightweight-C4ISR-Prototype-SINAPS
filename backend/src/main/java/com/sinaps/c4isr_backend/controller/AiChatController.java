package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.client.AIServiceClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * AI Chat Controller — Proxy to Python AI Microservice /chat endpoint
 * ============================================================================
 *
 * Provides:
 *   POST /api/v1/ai/chat  →  { "query": "..." }
 *                          ←  { "response": "...", "cited_rule": "...",
 *                               "rag_hits": N, "processing_time_ms": X }
 *
 * The request is forwarded to the Python FastAPI /chat endpoint which:
 *   1. Searches pgvector tactical_memory for relevant doctrine
 *   2. Builds a RAG-augmented prompt with Military AI Assistant persona
 *   3. Generates a response via local Gemma-2-9b-it model
 *   4. Returns the response with cited rules
 *
 * ============================================================================
 */
@Tag(
    name = "AI Chat",
    description = "Python AI mikroservisindeki RAG destekli Gemma-2-9b sohbet endpoint'ine proxy. " +
                  "Doktrin/angajman kurallarına dayalı askeri asistan."
)
@RestController
@RequestMapping("/api/v1/ai")
public class AiChatController {

    private static final Logger log = LoggerFactory.getLogger(AiChatController.class);

    private final AIServiceClient aiServiceClient;

    public AiChatController(AIServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    /**
     * POST /api/v1/ai/chat
     *
     * Proxies the user's chat query to the Python AI service's /chat endpoint.
     *
     * Request body:
     * {
     *   "query": "Drone bataryası %15'in altına düştüğünde ne yapılmalı?"
     * }
     *
     * Response body:
     * {
     *   "response": "TSK doktrin ve angajman kurallarına göre...",
     *   "cited_rule": "IHA batarya seviyesi %20 altına düşerse RTH başlatılmalıdır...",
     *   "rag_hits": 3,
     *   "processing_time_ms": 1523.45
     * }
     */
    @Operation(
        summary = "AI'ya sohbet sorusu gönder",
        description = "Body: `{ \"query\": \"...\" }`. AI servisi pgvector üzerinde RAG araması yapar, Gemma 2 ile yanıt üretir. " +
                      "Yanıtta `response`, `cited_rule`, `rag_hits`, `processing_time_ms` döner."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "AI yanıtı"),
        @ApiResponse(responseCode = "400", description = "Boş query"),
        @ApiResponse(responseCode = "500", description = "AI servisi erişilemez")
    })
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request) {
        String query = request.get("query");

        if (query == null || query.isBlank()) {
            Map<String, Object> error = new HashMap<>();
            error.put("response", "Sorgu boş olamaz.");
            error.put("cited_rule", "");
            error.put("rag_hits", 0);
            error.put("processing_time_ms", 0.0);
            return ResponseEntity.badRequest().body(error);
        }

        log.info("AI Chat request received: {}", query.length() > 80 ? query.substring(0, 80) + "..." : query);

        // Forward to Python AI service via AIServiceClient (non-blocking, but block here for REST)
        Map<String, Object> result = aiServiceClient.chatAsync(query).block();

        if (result == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("response", "AI servisi yanıt veremedi. Lütfen daha sonra tekrar deneyin.");
            error.put("cited_rule", "");
            error.put("rag_hits", 0);
            error.put("processing_time_ms", 0.0);
            return ResponseEntity.internalServerError().body(error);
        }

        log.info("AI Chat response proxied successfully, rag_hits: {}", result.get("rag_hits"));
        return ResponseEntity.ok(result);
    }
}
