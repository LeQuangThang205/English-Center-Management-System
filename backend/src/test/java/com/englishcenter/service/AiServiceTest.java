package com.englishcenter.service;

import com.englishcenter.config.AiProperties;
import com.englishcenter.dto.response.AiChatResponse;
import com.englishcenter.entity.AiConversation;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ConversationType;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.exception.AiProviderException;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.AiConversationRepository;
import com.englishcenter.repository.AiMessageRepository;
import com.englishcenter.service.ai.AiChatReply;
import com.englishcenter.service.ai.AiContextBuilder;
import com.englishcenter.service.ai.AiProvider;
import com.englishcenter.service.impl.AiServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private AiConversationRepository conversationRepository;

    @Mock
    private AiMessageRepository messageRepository;

    @Mock
    private AiProvider aiProvider;

    @Mock
    private AiContextBuilder contextBuilder;

    @Mock
    private AiProperties properties;

    private AiService aiService;

    private User studentA;
    private User studentB;
    private AiConversation owned;

    @BeforeEach
    void setUp() {
        aiService = new AiServiceImpl(
                conversationRepository, messageRepository, aiProvider, contextBuilder, properties);
        studentA = user(1L, Role.STUDENT);
        studentB = user(2L, Role.STUDENT);
        owned = AiConversation.builder()
                .id(10L).user(studentA).type(ConversationType.CHATBOT).title("hello")
                .build();
    }

    /**
     * Chỉ stub cho các test đi tới provider call. Không để trong setUp vì
     * Mockito strict-stubs sẽ báo UnnecessaryStubbingException ở các test
     * throw sớm (ownership 404, blank message) hoặc không gọi chat().
     */
    private void stubChatPrerequisites() {
        when(properties.getMaxOutputTokens()).thenReturn(500);
        when(contextBuilder.buildSystemPrompt(any())).thenReturn("system");
    }

    private User user(Long id, Role role) {
        return User.builder()
                .id(id).email("user" + id + "@example.com").passwordHash("hash")
                .fullName("User " + id).phone("0123456789")
                .role(role).status(UserStatus.ACTIVE)
                .build();
    }

    private void stubProvider(String text) {
        when(aiProvider.complete(any())).thenReturn(AiChatReply.builder().text(text).build());
    }

    private void stubSaveConversation(AiConversation conversation) {
        when(conversationRepository.save(any(AiConversation.class))).thenAnswer(inv -> {
            AiConversation c = inv.getArgument(0);
            if (c.getId() == null) {
                c.setId(99L);
            }
            return c;
        });
        when(messageRepository.maxSequenceNumber(any())).thenReturn(0);
        if (conversation != null) {
            when(conversationRepository.findById(conversation.getId()))
                    .thenReturn(Optional.of(conversation));
        }
    }

    @Test
    @DisplayName("chat() — hội thoại mới lưu thành công, historySaved=true")
    void chatNewConversationSaved() {
        stubChatPrerequisites();
        stubProvider("Xin chào");
        stubSaveConversation(null);

        AiChatResponse response = aiService.chat("hello", null, studentA);

        assertThat(response.getReply()).isEqualTo("Xin chào");
        assertThat(response.getConversationId()).isEqualTo(99L);
        assertThat(response.isHistorySaved()).isTrue();
        assertThat(response.getNotice()).isNull();
    }

    @Test
    @DisplayName("chat() — conversation của người khác ném 404 và không gọi provider")
    void chatOtherConversationForbidden() {
        AiConversation others = AiConversation.builder()
                .id(11L).user(studentB).type(ConversationType.CHATBOT).title("x")
                .build();
        when(conversationRepository.findById(11L)).thenReturn(Optional.of(others));

        assertThatThrownBy(() -> aiService.chat("hello", 11L, studentA))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(aiProvider, never()).complete(any());
    }

    @Test
    @DisplayName("chat() — provider lỗi ném BusinessException 'AI đang bận'")
    void chatProviderFailure() {
        stubChatPrerequisites();
        when(aiProvider.complete(any())).thenThrow(new AiProviderException("boom"));

        assertThatThrownBy(() -> aiService.chat("hello", null, studentA))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("AI đang bận");
    }

    @Test
    @DisplayName("chat() — lưu DB thất bại trả historySaved=false kèm notice, không giả vờ đã lưu")
    void chatSaveFailureNotPretended() {
        stubChatPrerequisites();
        stubProvider("Xin chào");
        when(conversationRepository.save(any(AiConversation.class)))
                .thenThrow(new RuntimeException("db down"));

        AiChatResponse response = aiService.chat("hello", null, studentA);

        assertThat(response.getReply()).isEqualTo("Xin chào");
        assertThat(response.isHistorySaved()).isFalse();
        assertThat(response.getNotice()).contains("không lưu được lịch sử");
        assertThat(response.getConversationId()).isNull();
    }

    @Test
    @DisplayName("chat() — message rỗng ném BusinessException")
    void chatBlankMessage() {
        assertThatThrownBy(() -> aiService.chat("  ", null, studentA))
                .isInstanceOf(BusinessException.class);
        verify(aiProvider, never()).complete(any());
    }

    @Test
    @DisplayName("chat() — tiếp tục hội thoại của mình append sequence tiếp theo")
    void chatExistingConversation() {
        stubChatPrerequisites();
        stubProvider("reply");
        stubSaveConversation(owned);
        when(messageRepository.maxSequenceNumber(10L)).thenReturn(2);

        AiChatResponse response = aiService.chat("next", 10L, studentA);

        assertThat(response.getConversationId()).isEqualTo(10L);
        assertThat(response.isHistorySaved()).isTrue();
    }

    @Test
    @DisplayName("conversations() — chỉ trả hội thoại của chính mình")
    void conversationsScoped() {
        when(conversationRepository.findByUser_IdOrderByUpdatedAtDesc(1L)).thenReturn(List.of(owned));

        assertThat(aiService.conversations(studentA)).hasSize(1);
        verify(conversationRepository).findByUser_IdOrderByUpdatedAtDesc(1L);
    }

    @Test
    @DisplayName("conversationDetail() — của người khác ném 404")
    void detailOtherForbidden() {
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(owned));

        assertThatThrownBy(() -> aiService.conversationDetail(10L, studentB))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteConversation() — của người khác ném 404 và không xóa")
    void deleteOtherForbidden() {
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(owned));

        assertThatThrownBy(() -> aiService.deleteConversation(10L, studentB))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(conversationRepository, never()).delete(any());
    }
}
