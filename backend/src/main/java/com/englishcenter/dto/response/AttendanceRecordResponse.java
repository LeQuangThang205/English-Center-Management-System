package com.englishcenter.dto.response;

import com.englishcenter.entity.AttendanceRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AttendanceRecordResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String status;

    public static AttendanceRecordResponse fromEntity(AttendanceRecord record) {
        return AttendanceRecordResponse.builder()
                .id(record.getId())
                .studentId(record.getStudent().getId())
                .studentName(record.getStudent().getFullName())
                .status(record.getStatus().name())
                .build();
    }
}
