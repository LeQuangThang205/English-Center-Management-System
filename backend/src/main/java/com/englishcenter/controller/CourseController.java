package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateCourseRequest;
import com.englishcenter.dto.request.UpdateCourseRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.CourseResponse;
import com.englishcenter.entity.Course;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @RequestBody CreateCourseRequest request) {
        requireAdmin(currentUser);
        Course course = Course.builder()
                .name(request.getName())
                .description(request.getDescription())
                .tuition(request.getTuition())
                .level(request.getLevel())
                .duration(request.getDuration())
                .status(request.getStatus())
                .build();
        Course created = courseService.create(course);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(CourseResponse.fromEntity(created), "Course created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseResponse>>> findAll(
            @RequestParam(required = false) CourseStatus status,
            @RequestParam(required = false) CourseLevel level) {
        List<Course> courses;
        if (status != null) {
            courses = courseService.findAllByStatus(status);
        } else if (level != null) {
            courses = courseService.findAllByLevel(level);
        } else {
            courses = courseService.findAll();
        }
        List<CourseResponse> response = courses.stream().map(CourseResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> findById(@PathVariable Long id) {
        Course course = courseService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(CourseResponse.fromEntity(course)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> update(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody UpdateCourseRequest request) {
        requireAdmin(currentUser);
        Course course = Course.builder()
                .name(request.getName())
                .description(request.getDescription())
                .tuition(request.getTuition())
                .level(request.getLevel())
                .duration(request.getDuration())
                .status(request.getStatus())
                .build();
        Course updated = courseService.update(id, course);
        return ResponseEntity.ok(ApiResponse.success(CourseResponse.fromEntity(updated), "Course updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        requireAdmin(currentUser);
        courseService.delete(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    private void requireAdmin(User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
