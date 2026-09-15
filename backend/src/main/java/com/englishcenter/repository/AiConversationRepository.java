package com.englishcenter.repository;

import com.englishcenter.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    List<AiConversation> findByUser_IdOrderByUpdatedAtDesc(Long userId);

    boolean existsByIdAndUser_Id(Long id, Long userId);
}
