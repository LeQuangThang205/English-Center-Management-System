package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateStudentProfileRequest;
import com.englishcenter.dto.request.UpdateStudentProfileRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.StudentProfileResponse;
import com.englishcenter.entity.StudentProfile;
import com.englishcenter.entity.User;
import com.englishcenter.service.StudentProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-profiles")
@RequiredArgsConstructor
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    @PostMapping
    public ResponseEntity<ApiResponse<StudentProfileResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @RequestBody CreateStudentProfileRequest request) {
        User user = User.builder().id(request.getUserId()).build();
        StudentProfile profile = StudentProfile.builder()
                .user(user)
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .enrollmentDate(request.getEnrollmentDate())
                .build();
        StudentProfile created = studentProfileService.create(profile, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(StudentProfileResponse.fromEntity(created), "Student profile created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudentProfileResponse>>> findAll(
            @AuthenticationPrincipal User currentUser) {
        List<StudentProfile> profiles = studentProfileService.findAll(currentUser);
        List<StudentProfileResponse> response = profiles.stream().map(StudentProfileResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> findByUserId(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        StudentProfile profile = studentProfileService.findByUserId(userId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(StudentProfileResponse.fromEntity(profile)));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> findByEmail(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String email) {
        StudentProfile profile = studentProfileService.findByEmail(email, currentUser);
        return ResponseEntity.ok(ApiResponse.success(StudentProfileResponse.fromEntity(profile)));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> update(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId,
            @RequestBody UpdateStudentProfileRequest request) {
        StudentProfile profile = StudentProfile.builder()
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .enrollmentDate(request.getEnrollmentDate())
                .build();
        StudentProfile updated = studentProfileService.update(userId, profile, currentUser);
        return ResponseEntity.ok(ApiResponse.success(StudentProfileResponse.fromEntity(updated), "Student profile updated successfully"));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        studentProfileService.delete(userId, currentUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
