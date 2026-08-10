package com.englishcenter.dto.response;

import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.ScheduleDay;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@Builder
public class CourseClassResponse {
    private Long id;
    private Long courseId;
    private String courseName;
    private String name;
    private Long teacherId;
    private String teacherName;
    private Integer maxCapacity;
    private Integer currentHeadcount;
    private ScheduleDay scheduleDay;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private LocalDate startDate;
    private LocalDate endDate;
    private ClassStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CourseClassResponse fromEntity(CourseClass courseClass) {
        CourseClassResponseBuilder builder = CourseClassResponse.builder()
                .id(courseClass.getId())
                .courseId(courseClass.getCourse().getId())
                .courseName(courseClass.getCourse().getName())
                .name(courseClass.getName())
                .maxCapacity(courseClass.getMaxCapacity())
                .currentHeadcount(courseClass.getCurrentHeadcount())
                .scheduleDay(courseClass.getScheduleDay())
                .startTime(courseClass.getStartTime())
                .endTime(courseClass.getEndTime())
                .room(courseClass.getRoom())
                .startDate(courseClass.getStartDate())
                .endDate(courseClass.getEndDate())
                .status(courseClass.getStatus())
                .createdAt(courseClass.getCreatedAt())
                .updatedAt(courseClass.getUpdatedAt());
        if (courseClass.getTeacher() != null) {
            builder.teacherId(courseClass.getTeacher().getId());
            builder.teacherName(courseClass.getTeacher().getFullName());
        }
        return builder.build();
    }
}
