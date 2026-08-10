package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateCourseClassRequest;
import com.englishcenter.dto.request.UpdateCourseClassRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.CourseClassResponse;
import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.service.CourseClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class CourseClassController {

    private final CourseClassService courseClassService;

    @PostMapping
    public ResponseEntity<ApiResponse<CourseClassResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @RequestBody CreateCourseClassRequest request) {
        CourseClass courseClass = CourseClass.builder()
                .course(Course.builder().id(request.getCourseId()).build())
                .name(request.getName())
                .teacher(request.getTeacherId() != null ? User.builder().id(request.getTeacherId()).build() : null)
                .maxCapacity(request.getMaxCapacity())
                .scheduleDay(request.getScheduleDay())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .room(request.getRoom())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus())
                .build();
        CourseClass created = courseClassService.create(courseClass, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(CourseClassResponse.fromEntity(created), "Class created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseClassResponse>>> findAll(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) ClassStatus status) {
        List<CourseClass> classes;
        if (courseId != null) {
            classes = courseClassService.findAllByCourseId(courseId);
        } else if (teacherId != null) {
            classes = courseClassService.findAllByTeacherId(teacherId);
        } else if (status != null) {
            classes = courseClassService.findAllByStatus(status);
        } else {
            classes = courseClassService.findAll();
        }
        List<CourseClassResponse> response = classes.stream().map(CourseClassResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseClassResponse>> findById(@PathVariable Long id) {
        CourseClass courseClass = courseClassService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(CourseClassResponse.fromEntity(courseClass)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseClassResponse>> update(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody UpdateCourseClassRequest request) {
        CourseClass courseClass = CourseClass.builder()
                .name(request.getName())
                .teacher(request.getTeacherId() != null ? User.builder().id(request.getTeacherId()).build() : null)
                .maxCapacity(request.getMaxCapacity())
                .scheduleDay(request.getScheduleDay())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .room(request.getRoom())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus())
                .build();
        CourseClass updated = courseClassService.update(id, courseClass, currentUser);
        return ResponseEntity.ok(ApiResponse.success(CourseClassResponse.fromEntity(updated), "Class updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        courseClassService.delete(id, currentUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
