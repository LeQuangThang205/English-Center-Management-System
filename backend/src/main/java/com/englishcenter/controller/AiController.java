package com.englishcenter.controller;

import com.englishcenter.dto.request.AiChatRequest;
import com.englishcenter.dto.response.AiChatResponse;
import com.englishcenter.dto.response.AiConversationDetailResponse;
import com.englishcenter.dto.response.AiConversationResponse;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.entity.User;
import com.englishcenter.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody AiChatRequest request) {
        AiChatResponse response = aiService.chat(request.getMessage(), request.getConversationId(), currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationResponse>>> conversations(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(aiService.conversations(currentUser)));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<AiConversationDetailResponse>> conversationDetail(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(aiService.conversationDetail(id, currentUser)));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        aiService.deleteConversation(id, currentUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
