package com.englishcenter.dto.request;

import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {
    private String email;
    private String passwordHash;
    private String fullName;
    private String phone;
    private Role role;
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;
    private String avatarUrl;
}
