package com.englishcenter.dto.request;

import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.ScheduleDay;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCourseClassRequest {
    private Long courseId;
    private String name;
    private Long teacherId;
    private Integer maxCapacity;
    private ScheduleDay scheduleDay;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private LocalDate startDate;
    private LocalDate endDate;
    @Builder.Default
    private ClassStatus status = ClassStatus.UPCOMING;
}
