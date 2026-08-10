package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateAttendanceSheetRequest;
import com.englishcenter.dto.request.UpdateAttendanceSheetRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.AttendanceSheetResponse;
import com.englishcenter.entity.AttendanceSheet;
import com.englishcenter.entity.User;
import com.englishcenter.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/sheets")
    public ResponseEntity<ApiResponse<AttendanceSheetResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateAttendanceSheetRequest request) {
        AttendanceSheet sheet = attendanceService.create(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(AttendanceSheetResponse.fromEntity(sheet), "Attendance sheet created successfully"));
    }

    @GetMapping("/sheets")
    public ResponseEntity<ApiResponse<List<AttendanceSheetResponse>>> findAll(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<AttendanceSheet> sheets = attendanceService.findAll(classId, date, currentUser);
        List<AttendanceSheetResponse> response = sheets.stream().map(AttendanceSheetResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/sheets/{id}")
    public ResponseEntity<ApiResponse<AttendanceSheetResponse>> findById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        AttendanceSheet sheet = attendanceService.findById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(AttendanceSheetResponse.fromEntity(sheet)));
    }

    @PutMapping("/sheets/{id}")
    public ResponseEntity<ApiResponse<AttendanceSheetResponse>> update(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateAttendanceSheetRequest request) {
        AttendanceSheet sheet = attendanceService.update(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(AttendanceSheetResponse.fromEntity(sheet), "Attendance sheet updated successfully"));
    }
}
