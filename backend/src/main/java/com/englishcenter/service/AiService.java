package com.englishcenter.service;

import com.englishcenter.dto.response.AiChatResponse;
import com.englishcenter.dto.response.AiConversationDetailResponse;
import com.englishcenter.dto.response.AiConversationResponse;
import com.englishcenter.entity.User;

import java.util.List;

public interface AiService {

    AiChatResponse chat(String message, Long conversationId, User currentUser);

    List<AiConversationResponse> conversations(User currentUser);

    AiConversationDetailResponse conversationDetail(Long id, User currentUser);

    void deleteConversation(Long id, User currentUser);
}
