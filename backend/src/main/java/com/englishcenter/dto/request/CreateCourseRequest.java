package com.englishcenter.dto.request;

import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCourseRequest {
    private String name;
    private String description;
    private BigDecimal tuition;
    private CourseLevel level;
    private Integer duration;
    @Builder.Default
    private CourseStatus status = CourseStatus.ACTIVE;
}
