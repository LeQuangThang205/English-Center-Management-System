package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateRegistrationRequest;
import com.englishcenter.dto.request.RejectRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.RegistrationResponse;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping
    public ResponseEntity<ApiResponse<RegistrationResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @RequestBody CreateRegistrationRequest request) {
        Registration registration = Registration.builder()
                .student(User.builder().id(request.getStudentId()).build())
                .courseClass(CourseClass.builder().id(request.getClassId()).build())
                .build();
        Registration created = registrationService.create(registration, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(RegistrationResponse.fromEntity(created), "Registration created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> findAll(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) RegistrationStatus status) {
        List<Registration> registrations = registrationService.findAll(studentId, classId, status);
        List<RegistrationResponse> response = registrations.stream().map(RegistrationResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RegistrationResponse>> findById(@PathVariable Long id) {
        Registration registration = registrationService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(RegistrationResponse.fromEntity(registration)));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<RegistrationResponse>> approve(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        Registration registration = registrationService.approve(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(RegistrationResponse.fromEntity(registration), "Registration approved successfully"));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<RegistrationResponse>> reject(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody(required = false) RejectRequest request) {
        String reason = request != null ? request.getReason() : null;
        Registration registration = registrationService.reject(id, reason, currentUser);
        return ResponseEntity.ok(ApiResponse.success(RegistrationResponse.fromEntity(registration), "Registration rejected successfully"));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        registrationService.cancel(id, currentUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<ApiResponse<RegistrationResponse>> markPaid(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        Registration registration = registrationService.markPaid(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(RegistrationResponse.fromEntity(registration), "Registration marked as paid successfully"));
    }
}
