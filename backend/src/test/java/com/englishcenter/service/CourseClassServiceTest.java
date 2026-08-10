package com.englishcenter.service;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.*;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.CourseRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.service.impl.CourseClassServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseClassServiceTest {

    @Mock
    private CourseClassRepository courseClassRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserRepository userRepository;

    private CourseClassService courseClassService;

    private Course course;
    private User teacher;
    private CourseClass courseClass;

    @BeforeEach
    void setUp() {
        courseClassService = new CourseClassServiceImpl(courseClassRepository, courseRepository, userRepository);
        course = Course.builder()
                .id(1L)
                .name("English for Beginners")
                .tuition(new BigDecimal("1500000"))
                .level(CourseLevel.BEGINNER)
                .duration(12)
                .build();
        teacher = User.builder()
                .id(2L)
                .fullName("Tran Thi B")
                .email("tranthib@example.com")
                .role(Role.TEACHER)
                .build();
        courseClass = CourseClass.builder()
                .id(1L)
                .course(course)
                .name("Morning Class 01")
                .teacher(teacher)
                .maxCapacity(20)
                .currentHeadcount(0)
                .scheduleDay(ScheduleDay.MON)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .room("Room 101")
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 10, 31))
                .status(ClassStatus.UPCOMING)
                .build();
    }

    @Test
    @DisplayName("create() — tạo class thành công")
    void createSuccess() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(2L)).thenReturn(Optional.of(teacher));
        when(courseClassRepository.save(any(CourseClass.class))).thenReturn(courseClass);

        CourseClass created = courseClassService.create(courseClass);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getName()).isEqualTo("Morning Class 01");
        verify(courseClassRepository).save(courseClass);
    }

    @Test
    @DisplayName("create() — course không tồn tại ném ResourceNotFoundException")
    void createCourseNotFound() {
        when(courseRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseClassService.create(courseClass))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("create() — maxCapacity <= 0 ném BusinessException")
    void createInvalidMaxCapacity() {
        courseClass.setMaxCapacity(0);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseClassService.create(courseClass))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("maxCapacity must be greater than 0");
    }

    @Test
    @DisplayName("create() — startDate > endDate ném BusinessException")
    void createInvalidDateRange() {
        courseClass.setStartDate(LocalDate.of(2026, 12, 1));
        courseClass.setEndDate(LocalDate.of(2026, 10, 31));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseClassService.create(courseClass))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("startDate must be before endDate");
    }

    @Test
    @DisplayName("create() — startTime >= endTime ném BusinessException")
    void createInvalidTimeRange() {
        courseClass.setStartTime(LocalTime.of(10, 0));
        courseClass.setEndTime(LocalTime.of(8, 0));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseClassService.create(courseClass))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("startTime must be before endTime");
    }

    @Test
    @DisplayName("create() — teacher không tồn tại ném ResourceNotFoundException")
    void createTeacherNotFound() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseClassService.create(courseClass))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("findById() — tìm thấy class")
    void findByIdFound() {
        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));

        CourseClass found = courseClassService.findById(1L);

        assertThat(found.getName()).isEqualTo("Morning Class 01");
    }

    @Test
    @DisplayName("findById() — không tìm thấy ném ResourceNotFoundException")
    void findByIdNotFound() {
        when(courseClassRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseClassService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("findAll() — trả về tất cả classes")
    void findAll() {
        when(courseClassRepository.findAll()).thenReturn(List.of(courseClass));

        List<CourseClass> classes = courseClassService.findAll();

        assertThat(classes).hasSize(1);
    }

    @Test
    @DisplayName("findAllByCourseId() — lọc theo course")
    void findAllByCourseId() {
        when(courseClassRepository.findByCourse_Id(1L)).thenReturn(List.of(courseClass));

        List<CourseClass> classes = courseClassService.findAllByCourseId(1L);

        assertThat(classes).hasSize(1);
    }

    @Test
    @DisplayName("findAllByTeacherId() — lọc theo teacher")
    void findAllByTeacherId() {
        when(courseClassRepository.findByTeacher_Id(2L)).thenReturn(List.of(courseClass));

        List<CourseClass> classes = courseClassService.findAllByTeacherId(2L);

        assertThat(classes).hasSize(1);
    }

    @Test
    @DisplayName("findAllByStatus() — lọc theo trạng thái")
    void findAllByStatus() {
        when(courseClassRepository.findByStatus(ClassStatus.UPCOMING)).thenReturn(List.of(courseClass));

        List<CourseClass> classes = courseClassService.findAllByStatus(ClassStatus.UPCOMING);

        assertThat(classes).hasSize(1);
        assertThat(classes.get(0).getStatus()).isEqualTo(ClassStatus.UPCOMING);
    }

    @Test
    @DisplayName("update() — cập nhật class thành công")
    void updateSuccess() {
        CourseClass updatedClass = CourseClass.builder()
                .name("Afternoon Class 02")
                .maxCapacity(25)
                .scheduleDay(ScheduleDay.TUE)
                .startTime(LocalTime.of(13, 0))
                .endTime(LocalTime.of(15, 0))
                .room("Room 202")
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .status(ClassStatus.STUDYING)
                .build();

        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));
        when(courseClassRepository.save(any(CourseClass.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CourseClass result = courseClassService.update(1L, updatedClass);

        assertThat(result.getName()).isEqualTo("Afternoon Class 02");
        assertThat(result.getMaxCapacity()).isEqualTo(25);
        assertThat(result.getRoom()).isEqualTo("Room 202");
    }

    @Test
    @DisplayName("delete() — set status thành CANCELLED")
    void delete() {
        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));
        when(courseClassRepository.save(any(CourseClass.class))).thenAnswer(invocation -> invocation.getArgument(0));

        courseClassService.delete(1L);

        assertThat(courseClass.getStatus()).isEqualTo(ClassStatus.CANCELLED);
        verify(courseClassRepository).save(courseClass);
    }

    @Test
    @DisplayName("delete() — class không tồn tại ném ResourceNotFoundException")
    void deleteNotFound() {
        when(courseClassRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseClassService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
