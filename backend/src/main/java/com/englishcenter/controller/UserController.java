package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateUserRequest;
import com.englishcenter.dto.request.UpdateUserRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.UserResponse;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @RequestBody CreateUserRequest request) {
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(request.getPasswordHash())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .status(request.getStatus())
                .avatarUrl(request.getAvatarUrl())
                .build();
        User created = userService.create(user, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(UserResponse.fromEntity(created), "User created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> findAll(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) Role role) {
        List<User> users = userService.findAll(status, role, currentUser);
        List<UserResponse> response = users.stream().map(UserResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> findById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        User user = userService.findById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(UserResponse.fromEntity(user)));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<ApiResponse<UserResponse>> findByEmail(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String email) {
        User user = userService.findByEmail(email, currentUser);
        return ResponseEntity.ok(ApiResponse.success(UserResponse.fromEntity(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(request.getPasswordHash())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .status(request.getStatus())
                .avatarUrl(request.getAvatarUrl())
                .build();
        User updated = userService.update(id, user, currentUser);
        return ResponseEntity.ok(ApiResponse.success(UserResponse.fromEntity(updated), "User updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        userService.delete(id, currentUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
