package com.englishcenter.dto.response;

import com.englishcenter.entity.Registration;
import com.englishcenter.entity.enums.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
public class RegistrationResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long classId;
    private String className;
    private String courseName;
    private RegistrationStatus status;
    private BigDecimal tuitionAtRegistration;
    private LocalDateTime registeredAt;
    private LocalDateTime approvedAt;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime rejectedAt;
    private Long rejectedById;
    private String rejectedByName;
    private String rejectionReason;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RegistrationResponse fromEntity(Registration registration) {
        RegistrationResponseBuilder builder = RegistrationResponse.builder()
                .id(registration.getId())
                .studentId(registration.getStudent().getId())
                .studentName(registration.getStudent().getFullName())
                .classId(registration.getCourseClass().getId())
                .className(registration.getCourseClass().getName())
                .courseName(registration.getCourseClass().getCourse().getName())
                .status(registration.getStatus())
                .tuitionAtRegistration(registration.getTuitionAtRegistration())
                .registeredAt(registration.getRegisteredAt())
                .approvedAt(registration.getApprovedAt())
                .rejectedAt(registration.getRejectedAt())
                .rejectionReason(registration.getRejectionReason())
                .paidAt(registration.getPaidAt())
                .createdAt(registration.getCreatedAt())
                .updatedAt(registration.getUpdatedAt());
        if (registration.getApprovedBy() != null) {
            builder.approvedById(registration.getApprovedBy().getId());
            builder.approvedByName(registration.getApprovedBy().getFullName());
        }
        if (registration.getRejectedBy() != null) {
            builder.rejectedById(registration.getRejectedBy().getId());
            builder.rejectedByName(registration.getRejectedBy().getFullName());
        }
        return builder.build();
    }
}
