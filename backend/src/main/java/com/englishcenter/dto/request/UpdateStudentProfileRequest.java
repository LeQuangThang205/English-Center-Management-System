package com.englishcenter.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStudentProfileRequest {
    private LocalDate dateOfBirth;
    private String address;
    private LocalDate enrollmentDate;
}
