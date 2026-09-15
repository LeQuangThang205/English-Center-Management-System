package com.englishcenter.service.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatReply {

    /**
     * Nội dung trả lời đã trim. Không blank.
     */
    private String text;
}
