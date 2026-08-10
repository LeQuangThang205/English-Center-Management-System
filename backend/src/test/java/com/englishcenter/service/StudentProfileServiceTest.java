package com.englishcenter.service;

import com.englishcenter.entity.StudentProfile;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.StudentProfileRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.service.impl.StudentProfileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentProfileServiceTest {

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private UserRepository userRepository;

    private StudentProfileService studentProfileService;

    private User user;
    private StudentProfile profile;

    @BeforeEach
    void setUp() {
        studentProfileService = new StudentProfileServiceImpl(studentProfileRepository, userRepository);
        user = User.builder()
                .id(1L)
                .fullName("Nguyen Van A")
                .email("nguyenvana@example.com")
                .passwordHash("hashedPassword123")
                .phone("0123456789")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        profile = StudentProfile.builder()
                .userId(1L)
                .user(user)
                .dateOfBirth(LocalDate.of(2000, 1, 15))
                .address("Ha Noi")
                .enrollmentDate(LocalDate.now())
                .build();
        user.setStudentProfile(profile);
    }

    @Test
    @DisplayName("create() — tạo profile thành công")
    void createSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser_Id(1L)).thenReturn(Optional.empty());
        when(studentProfileRepository.save(any(StudentProfile.class))).thenReturn(profile);

        StudentProfile created = studentProfileService.create(profile);

        assertThat(created.getUserId()).isEqualTo(1L);
        assertThat(created.getAddress()).isEqualTo("Ha Noi");
        verify(studentProfileRepository).save(profile);
    }

    @Test
    @DisplayName("create() — user không tồn tại ném ResourceNotFoundException")
    void createUserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentProfileService.create(profile))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("create() — user không phải STUDENT ném BusinessException")
    void createUserNotStudent() {
        user.setRole(Role.TEACHER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> studentProfileService.create(profile))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("must have role STUDENT");
    }

    @Test
    @DisplayName("create() — profile đã tồn tại ném BusinessException")
    void createDuplicate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser_Id(1L)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> studentProfileService.create(profile))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("findByUserId() — tìm thấy profile")
    void findByUserIdFound() {
        when(studentProfileRepository.findByUser_Id(1L)).thenReturn(Optional.of(profile));

        StudentProfile found = studentProfileService.findByUserId(1L);

        assertThat(found.getAddress()).isEqualTo("Ha Noi");
    }

    @Test
    @DisplayName("findByUserId() — không tìm thấy ném ResourceNotFoundException")
    void findByUserIdNotFound() {
        when(studentProfileRepository.findByUser_Id(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentProfileService.findByUserId(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("findByEmail() — tìm thấy profile")
    void findByEmailFound() {
        when(studentProfileRepository.findByUser_Email("nguyenvana@example.com")).thenReturn(Optional.of(profile));

        StudentProfile found = studentProfileService.findByEmail("nguyenvana@example.com");

        assertThat(found.getUser().getEmail()).isEqualTo("nguyenvana@example.com");
    }

    @Test
    @DisplayName("findByEmail() — không tìm thấy ném ResourceNotFoundException")
    void findByEmailNotFound() {
        when(studentProfileRepository.findByUser_Email("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentProfileService.findByEmail("unknown@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("findAll() — trả về tất cả profiles")
    void findAll() {
        when(studentProfileRepository.findAll()).thenReturn(List.of(profile));

        List<StudentProfile> profiles = studentProfileService.findAll();

        assertThat(profiles).hasSize(1);
    }

    @Test
    @DisplayName("update() — cập nhật profile thành công")
    void updateSuccess() {
        StudentProfile updatedProfile = StudentProfile.builder()
                .dateOfBirth(LocalDate.of(2001, 5, 10))
                .address("Ho Chi Minh City")
                .enrollmentDate(LocalDate.now())
                .build();

        when(studentProfileRepository.findByUser_Id(1L)).thenReturn(Optional.of(profile));
        when(studentProfileRepository.save(any(StudentProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StudentProfile result = studentProfileService.update(1L, updatedProfile);

        assertThat(result.getAddress()).isEqualTo("Ho Chi Minh City");
        assertThat(result.getDateOfBirth()).isEqualTo(LocalDate.of(2001, 5, 10));
    }

    @Test
    @DisplayName("delete() — xóa profile thành công")
    void deleteSuccess() {
        when(studentProfileRepository.findByUser_Id(1L)).thenReturn(Optional.of(profile));

        studentProfileService.delete(1L);

        assertThat(user.getStudentProfile()).isNull();
        verify(studentProfileRepository).delete(profile);
    }

    @Test
    @DisplayName("delete() — profile không tồn tại ném ResourceNotFoundException")
    void deleteNotFound() {
        when(studentProfileRepository.findByUser_Id(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentProfileService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
