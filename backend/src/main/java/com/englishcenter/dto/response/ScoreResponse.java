package com.englishcenter.dto.response;

import com.englishcenter.entity.Score;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
public class ScoreResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long classId;
    private String className;
    private String courseName;
    private BigDecimal midtermScore;
    private BigDecimal finalScore;
    private BigDecimal totalScore;
    private String comment;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ScoreResponse fromEntity(Score score) {
        ScoreResponseBuilder builder = ScoreResponse.builder()
                .id(score.getId())
                .studentId(score.getStudent().getId())
                .studentName(score.getStudent().getFullName())
                .classId(score.getCourseClass().getId())
                .className(score.getCourseClass().getName())
                .courseName(score.getCourseClass().getCourse().getName())
                .midtermScore(score.getMidtermScore())
                .finalScore(score.getFinalScore())
                .totalScore(score.getTotalScore())
                .comment(score.getComment())
                .createdAt(score.getCreatedAt())
                .updatedAt(score.getUpdatedAt());
        if (score.getCreatedBy() != null) {
            builder.createdById(score.getCreatedBy().getId());
            builder.createdByName(score.getCreatedBy().getFullName());
        }
        return builder.build();
    }
}
