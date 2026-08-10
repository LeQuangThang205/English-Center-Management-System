package com.englishcenter.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAttendanceSheetRequest {
    @NotNull(message = "Class id is required")
    private Long classId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotEmpty(message = "At least one attendance record is required")
    private List<AttendanceRecordRequest> records;
}
