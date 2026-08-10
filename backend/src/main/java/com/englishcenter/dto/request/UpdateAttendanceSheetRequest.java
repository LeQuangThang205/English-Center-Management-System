package com.englishcenter.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceSheetRequest {
    @NotEmpty(message = "At least one attendance record is required")
    private List<AttendanceRecordRequest> records;
}
