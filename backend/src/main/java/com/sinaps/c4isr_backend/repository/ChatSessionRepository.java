package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    /** All sessions, most recently updated first. */
    List<ChatSession> findAllByOrderByUpdatedAtDesc();
}
