package com.englishcenter.service;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.CourseRepository;
import com.englishcenter.service.impl.CourseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    private CourseService courseService;

    private Course course;

    @BeforeEach
    void setUp() {
        courseService = new CourseServiceImpl(courseRepository);
        course = Course.builder()
                .id(1L)
                .name("English for Beginners")
                .description("Basic English course")
                .tuition(new BigDecimal("1500000"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .status(CourseStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("create() — tạo course thành công")
    void createSuccess() {
        when(courseRepository.save(any(Course.class))).thenReturn(course);

        Course created = courseService.create(course);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getName()).isEqualTo("English for Beginners");
        verify(courseRepository).save(course);
    }

    @Test
    @DisplayName("findById() — tìm thấy course")
    void findByIdFound() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        Course found = courseService.findById(1L);

        assertThat(found.getName()).isEqualTo("English for Beginners");
    }

    @Test
    @DisplayName("findById() — không tìm thấy ném ResourceNotFoundException")
    void findByIdNotFound() {
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("findAll() — trả về tất cả courses")
    void findAll() {
        when(courseRepository.findAll()).thenReturn(List.of(course));

        List<Course> courses = courseService.findAll();

        assertThat(courses).hasSize(1);
    }

    @Test
    @DisplayName("findAllByStatus() — lọc theo trạng thái")
    void findAllByStatus() {
        when(courseRepository.findByStatus(CourseStatus.ACTIVE)).thenReturn(List.of(course));

        List<Course> courses = courseService.findAllByStatus(CourseStatus.ACTIVE);

        assertThat(courses).hasSize(1);
        assertThat(courses.get(0).getStatus()).isEqualTo(CourseStatus.ACTIVE);
    }

    @Test
    @DisplayName("findAllByLevel() — lọc theo level")
    void findAllByLevel() {
        when(courseRepository.findByLevel(CourseLevel.BEGINNER)).thenReturn(List.of(course));

        List<Course> courses = courseService.findAllByLevel(CourseLevel.BEGINNER);

        assertThat(courses).hasSize(1);
        assertThat(courses.get(0).getLevel()).isEqualTo(CourseLevel.BEGINNER);
    }

    @Test
    @DisplayName("update() — cập nhật course thành công")
    void updateSuccess() {
        Course updatedCourse = Course.builder()
                .name("English for Intermediate")
                .description("Intermediate level")
                .tuition(new BigDecimal("2000000"))
                .level(CourseLevel.INTERMEDIATE)
                .duration(16)
                .status(CourseStatus.ACTIVE)
                .build();

        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Course result = courseService.update(1L, updatedCourse);

        assertThat(result.getName()).isEqualTo("English for Intermediate");
        assertThat(result.getLevel()).isEqualTo(CourseLevel.INTERMEDIATE);
        assertThat(result.getTuition()).isEqualByComparingTo(new BigDecimal("2000000"));
    }

    @Test
    @DisplayName("delete() — set status thành DELETED")
    void delete() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));

        courseService.delete(1L);

        assertThat(course.getStatus()).isEqualTo(CourseStatus.DELETED);
        verify(courseRepository).save(course);
    }

    @Test
    @DisplayName("delete() — course không tồn tại ném ResourceNotFoundException")
    void deleteNotFound() {
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
