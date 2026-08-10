package com.englishcenter.dto.request;

import com.englishcenter.entity.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordRequest {
    @NotNull(message = "Student id is required")
    private Long studentId;

    @NotNull(message = "Attendance status is required")
    private AttendanceStatus status;
}
