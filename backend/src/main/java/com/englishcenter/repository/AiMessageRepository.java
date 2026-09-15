package com.englishcenter.repository;

import com.englishcenter.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversation_IdOrderBySequenceNumberAsc(Long conversationId);

    @Query("SELECT COALESCE(MAX(m.sequenceNumber), 0) FROM AiMessage m WHERE m.conversation.id = :conversationId")
    int maxSequenceNumber(Long conversationId);
}
