package com.englishcenter.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {

    /**
     * Base URL của AI provider (OpenAI-compatible). Ví dụ: https://api.openai.com/v1
     */
    private String baseUrl = "https://api.openai.com/v1";

    /**
     * Tên model. Ví dụ: gpt-4o-mini
     */
    private String model = "gpt-4o-mini";

    /**
     * API key — BẮT BUỘC qua biến môi trường AI_API_KEY, không hard-code.
     */
    private String apiKey = "";

    /**
     * Timeout (ms) cho mỗi lần gọi provider.
     */
    private int timeoutMs = 30000;

    /**
     * Số ký tự tối đa của context dữ liệu gửi kèm mỗi request.
     */
    private int maxContextChars = 6000;

    /**
     * Số token tối đa cho câu trả lời (map sang max_tokens của provider).
     */
    private int maxOutputTokens = 500;
}
