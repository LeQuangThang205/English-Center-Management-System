package com.englishcenter.dto.response;

import com.englishcenter.entity.AttendanceSheet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class AttendanceSheetResponse {
    private Long id;
    private Long classId;
    private String className;
    private String courseName;
    private LocalDate date;
    private Long createdById;
    private String createdByName;
    private List<AttendanceRecordResponse> records;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AttendanceSheetResponse fromEntity(AttendanceSheet sheet) {
        AttendanceSheetResponseBuilder builder = AttendanceSheetResponse.builder()
                .id(sheet.getId())
                .classId(sheet.getCourseClass().getId())
                .className(sheet.getCourseClass().getName())
                .courseName(sheet.getCourseClass().getCourse().getName())
                .date(sheet.getDate())
                .records(sheet.getRecords().stream().map(AttendanceRecordResponse::fromEntity).toList())
                .createdAt(sheet.getCreatedAt())
                .updatedAt(sheet.getUpdatedAt());
        if (sheet.getCreatedBy() != null) {
            builder.createdById(sheet.getCreatedBy().getId());
            builder.createdByName(sheet.getCreatedBy().getFullName());
        }
        return builder.build();
    }
}
