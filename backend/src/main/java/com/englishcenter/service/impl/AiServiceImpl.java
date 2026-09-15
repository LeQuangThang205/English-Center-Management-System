package com.englishcenter.service.impl;

import com.englishcenter.config.AiProperties;
import com.englishcenter.dto.response.AiChatResponse;
import com.englishcenter.dto.response.AiConversationDetailResponse;
import com.englishcenter.dto.response.AiConversationResponse;
import com.englishcenter.entity.AiConversation;
import com.englishcenter.entity.AiMessage;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ConversationType;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.exception.AiProviderException;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.AiConversationRepository;
import com.englishcenter.repository.AiMessageRepository;
import com.englishcenter.service.AiService;
import com.englishcenter.service.ai.AiChatRequest;
import com.englishcenter.service.ai.AiChatReply;
import com.englishcenter.service.ai.AiContextBuilder;
import com.englishcenter.service.ai.AiProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private static final int TITLE_MAX_LENGTH = 100;

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiProvider aiProvider;
    private final AiContextBuilder contextBuilder;
    private final AiProperties properties;

    @Override
    public AiChatResponse chat(String message, Long conversationId, User currentUser) {
        if (message == null || message.isBlank()) {
            throw new BusinessException("Message must not be blank");
        }
        // Ownership check TRƯỚC khi gọi provider (fail fast, không tốn API call).
        AiConversation conversation = null;
        if (conversationId != null) {
            conversation = ownedConversation(conversationId, currentUser);
        }
        String systemPrompt = contextBuilder.buildSystemPrompt(currentUser);
        String reply;
        try {
            AiChatReply chatReply = aiProvider.complete(AiChatRequest.builder()
                    .systemPrompt(systemPrompt)
                    .userMessage(message.strip())
                    .maxOutputTokens(properties.getMaxOutputTokens())
                    .build());
            reply = chatReply.getText();
        } catch (AiProviderException e) {
            throw new BusinessException("AI đang bận, vui lòng thử lại sau");
        }
        // Lưu conversation + message trong MỘT transaction. Nếu lưu thất bại,
        // transaction rollback toàn bộ (không tạo trạng thái nửa vời) và FE được
        // báo rõ historySaved=false — không giả vờ đã lưu.
        try {
            Long savedId = saveTurn(conversation, message.strip(), reply, currentUser);
            return AiChatResponse.builder()
                    .reply(reply)
                    .conversationId(savedId)
                    .historySaved(true)
                    .build();
        } catch (Exception e) {
            return AiChatResponse.builder()
                    .reply(reply)
                    .conversationId(conversation != null ? conversation.getId() : null)
                    .historySaved(false)
                    .notice("Đã nhận phản hồi AI nhưng không lưu được lịch sử. Vui lòng thử lại.")
                    .build();
        }
    }

    @Transactional
    protected Long saveTurn(AiConversation conversation, String question, String reply, User currentUser) {
        AiConversation target = conversation;
        if (target == null) {
            target = AiConversation.builder()
                    .user(currentUser)
                    .type(currentUser.getRole() == Role.ADMIN ? ConversationType.ASSISTANT : ConversationType.CHATBOT)
                    .title(question.length() > TITLE_MAX_LENGTH
                            ? question.substring(0, TITLE_MAX_LENGTH)
                            : question)
                    .build();
            target = conversationRepository.save(target);
        }
        int nextSequence = messageRepository.maxSequenceNumber(target.getId()) + 1;
        AiMessage turn = AiMessage.builder()
                .conversation(target)
                .sequenceNumber(nextSequence)
                .question(question)
                .response(reply)
                .build();
        target.getMessages().add(turn);
        conversationRepository.save(target);
        return target.getId();
    }

    @Override
    public List<AiConversationResponse> conversations(User currentUser) {
        return conversationRepository.findByUser_IdOrderByUpdatedAtDesc(currentUser.getId())
                .stream()
                .map(AiConversationResponse::fromEntity)
                .toList();
    }

    @Override
    public AiConversationDetailResponse conversationDetail(Long id, User currentUser) {
        AiConversation conversation = ownedConversation(id, currentUser);
        List<AiMessage> messages = messageRepository.findByConversation_IdOrderBySequenceNumberAsc(id);
        return AiConversationDetailResponse.fromEntity(conversation, messages);
    }

    @Override
    @Transactional
    public void deleteConversation(Long id, User currentUser) {
        AiConversation conversation = ownedConversation(id, currentUser);
        conversationRepository.delete(conversation);
    }

    /**
     * Ownership: user chỉ thao tác conversation của chính mình.
     * Trả 404 (không phải 403) để không leak sự tồn tại — đúng convention Notification.
     */
    private AiConversation ownedConversation(Long id, User currentUser) {
        return conversationRepository.findById(id)
                .filter(c -> c.getUser() != null && c.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("AiConversation", id));
    }
}
