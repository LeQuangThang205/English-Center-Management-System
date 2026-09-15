package com.englishcenter.service.ai;

import com.englishcenter.config.AiProperties;
import com.englishcenter.exception.AiProviderException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/**
 * Adapter cho provider OpenAI-compatible (OpenAI, hoặc bất kỳ gateway nào
 * hỗ trợ endpoint POST /chat/completions).
 *
 * Tự map AiChatRequest/AiChatReply sang JSON của provider — AiService không
 * phụ thuộc định dạng này.
 */
@Service
@RequiredArgsConstructor
public class LlmAiProvider implements AiProvider {

    private static final double TEMPERATURE = 0.3;

    private final AiProperties properties;

    @Qualifier("aiRestClient")
    private final RestClient restClient;

    private final ObjectMapper objectMapper;

    @Override
    public AiChatReply complete(AiChatRequest request) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new AiProviderException("AI provider is not configured (missing API key)");
        }
        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "messages", List.of(
                        Map.of("role", "system", "content", request.getSystemPrompt()),
                        Map.of("role", "user", "content", request.getUserMessage())),
                "max_tokens", request.getMaxOutputTokens(),
                "temperature", TEMPERATURE);
        try {
            String raw = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .body(body)
                    .retrieve()
                    .body(String.class);
            String text = extractText(raw);
            if (text == null || text.isBlank()) {
                throw new AiProviderException("AI provider returned an empty response");
            }
            return AiChatReply.builder().text(text.strip()).build();
        } catch (ResourceAccessException e) {
            throw new AiProviderException("AI provider timed out or is unreachable", e);
        } catch (RestClientException e) {
            throw new AiProviderException("AI provider request failed: " + e.getMessage(), e);
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new AiProviderException("Failed to process AI provider response", e);
        }
    }

    private String extractText(String raw) throws Exception {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        JsonNode root = objectMapper.readTree(raw);
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            return null;
        }
        return choices.get(0).path("message").path("content").asText(null);
    }
}
