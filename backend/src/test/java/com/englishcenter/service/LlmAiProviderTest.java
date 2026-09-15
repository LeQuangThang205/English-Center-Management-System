package com.englishcenter.service;

import com.englishcenter.config.AiProperties;
import com.englishcenter.exception.AiProviderException;
import com.englishcenter.service.ai.AiChatReply;
import com.englishcenter.service.ai.AiChatRequest;
import com.englishcenter.service.ai.AiProvider;
import com.englishcenter.service.ai.LlmAiProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class LlmAiProviderTest {

    private AiProperties properties;
    private MockRestServiceServer server;
    private AiProvider provider;

    @BeforeEach
    void setUp() {
        properties = new AiProperties();
        properties.setBaseUrl("https://ai.example.com/v1");
        properties.setModel("test-model");
        properties.setApiKey("secret-key");
        properties.setMaxOutputTokens(100);

        RestClient.Builder builder = RestClient.builder().baseUrl(properties.getBaseUrl());
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new LlmAiProvider(properties, builder.build(), new ObjectMapper());
    }

    private AiChatRequest request() {
        return AiChatRequest.builder()
                .systemPrompt("system")
                .userMessage("hello")
                .maxOutputTokens(100)
                .build();
    }

    private String okBody(String content) {
        return "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"" + content + "\"}}]}";
    }

    @Test
    @DisplayName("complete() — map reply và gửi đúng model + max_tokens")
    void completeSuccess() {
        server.expect(requestTo("https://ai.example.com/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.model").value("test-model"))
                .andExpect(jsonPath("$.max_tokens").value(100))
                .andRespond(withSuccess(okBody("Xin chào"), MediaType.APPLICATION_JSON));

        AiChatReply reply = provider.complete(request());

        assertThat(reply.getText()).isEqualTo("Xin chào");
        server.verify();
    }

    @Test
    @DisplayName("complete() — provider 500 ném AiProviderException")
    void completeServerError() {
        server.expect(requestTo("https://ai.example.com/v1/chat/completions"))
                .andRespond(withServerError());

        assertThatThrownBy(() -> provider.complete(request()))
                .isInstanceOf(AiProviderException.class);
        server.verify();
    }

    @Test
    @DisplayName("complete() — response rỗng ném AiProviderException")
    void completeEmptyResponse() {
        server.expect(requestTo("https://ai.example.com/v1/chat/completions"))
                .andRespond(withSuccess("{\"choices\":[]}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> provider.complete(request()))
                .isInstanceOf(AiProviderException.class);
        server.verify();
    }

    @Test
    @DisplayName("complete() — thiếu API key ném AiProviderException mà không gọi HTTP")
    void completeMissingApiKey() {
        properties.setApiKey("  ");

        assertThatThrownBy(() -> provider.complete(request()))
                .isInstanceOf(AiProviderException.class)
                .hasMessageContaining("API key");
        server.verify();
    }
}
