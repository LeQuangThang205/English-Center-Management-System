package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateScoreRequest;
import com.englishcenter.dto.request.UpdateScoreRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.ScoreResponse;
import com.englishcenter.entity.Score;
import com.englishcenter.entity.User;
import com.englishcenter.service.ScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;

    @PostMapping
    public ResponseEntity<ApiResponse<ScoreResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateScoreRequest request) {
        Score score = scoreService.create(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ScoreResponse.fromEntity(score), "Score saved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> findAll(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long classId) {
        List<Score> scores = scoreService.findAll(studentId, classId, currentUser);
        List<ScoreResponse> response = scores.stream().map(ScoreResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScoreResponse>> findById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        Score score = scoreService.findById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(ScoreResponse.fromEntity(score)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ScoreResponse>> update(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateScoreRequest request) {
        Score score = scoreService.update(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(ScoreResponse.fromEntity(score), "Score updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        scoreService.delete(id, currentUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
