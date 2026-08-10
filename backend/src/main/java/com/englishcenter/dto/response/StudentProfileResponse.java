package com.englishcenter.dto.response;

import com.englishcenter.entity.StudentProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
public class StudentProfileResponse {
    private Long userId;
    private String fullName;
    private String email;
    private LocalDate dateOfBirth;
    private String address;
    private LocalDate enrollmentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static StudentProfileResponse fromEntity(StudentProfile profile) {
        return StudentProfileResponse.builder()
                .userId(profile.getUserId())
                .fullName(profile.getUser().getFullName())
                .email(profile.getUser().getEmail())
                .dateOfBirth(profile.getDateOfBirth())
                .address(profile.getAddress())
                .enrollmentDate(profile.getEnrollmentDate())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
