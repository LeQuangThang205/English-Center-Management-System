package com.englishcenter.dto.response;

import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.enums.ScheduleDay;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@Builder
public class ScheduleResponse {
    private Long classId;
    private String className;
    private String courseName;
    private ScheduleDay scheduleDay;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private Long teacherId;
    private String teacherName;
    private LocalDate startDate;
    private LocalDate endDate;

    public static ScheduleResponse fromEntity(CourseClass courseClass) {
        ScheduleResponseBuilder builder = ScheduleResponse.builder()
                .classId(courseClass.getId())
                .className(courseClass.getName())
                .courseName(courseClass.getCourse().getName())
                .scheduleDay(courseClass.getScheduleDay())
                .startTime(courseClass.getStartTime())
                .endTime(courseClass.getEndTime())
                .room(courseClass.getRoom())
                .startDate(courseClass.getStartDate())
                .endDate(courseClass.getEndDate());
        if (courseClass.getTeacher() != null) {
            builder.teacherId(courseClass.getTeacher().getId());
            builder.teacherName(courseClass.getTeacher().getFullName());
        }
        return builder.build();
    }
}
