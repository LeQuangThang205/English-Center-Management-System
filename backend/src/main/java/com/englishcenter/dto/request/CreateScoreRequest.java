package com.englishcenter.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateScoreRequest {
    @NotNull(message = "Student id is required")
    private Long studentId;

    @NotNull(message = "Class id is required")
    private Long classId;

    @DecimalMin(value = "0.0", message = "Midterm score must be between 0 and 10")
    @DecimalMax(value = "10.0", message = "Midterm score must be between 0 and 10")
    private BigDecimal midtermScore;

    @DecimalMin(value = "0.0", message = "Final score must be between 0 and 10")
    @DecimalMax(value = "10.0", message = "Final score must be between 0 and 10")
    private BigDecimal finalScore;

    private String comment;
}
