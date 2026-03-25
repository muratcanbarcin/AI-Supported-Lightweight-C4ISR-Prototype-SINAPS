package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /** All messages for a session, ordered chronologically. */
    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    /** Count messages in a session (used to determine if title should be auto-set). */
    long countBySessionId(Long sessionId);
}
