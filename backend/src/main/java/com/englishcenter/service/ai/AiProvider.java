package com.englishcenter.service.ai;

/**
 * Contract độc lập provider cho AI chat.
 *
 * AiService chỉ phụ thuộc interface này — không biết JSON của OpenAI/Gemini.
 * Mỗi provider có adapter riêng tự map request/response.
 */
public interface AiProvider {

    /**
     * Gửi một lượt chat và trả về câu trả lời.
     *
     * @throws com.englishcenter.exception.AiProviderException khi provider lỗi/timeout/trả về rỗng
     */
    AiChatReply complete(AiChatRequest request);
}
