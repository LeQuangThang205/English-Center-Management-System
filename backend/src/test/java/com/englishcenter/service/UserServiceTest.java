package com.englishcenter.service;

import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.exception.DuplicateResourceException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository);
        user = User.builder()
                .id(1L)
                .fullName("Nguyen Van A")
                .email("nguyenvana@example.com")
                .passwordHash("hashedPassword123")
                .phone("0123456789")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("create() — tạo user thành công")
    void createSuccess() {
        when(userRepository.existsByEmail(user.getEmail())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(user);

        User created = userService.create(user);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getEmail()).isEqualTo("nguyenvana@example.com");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("create() — email đã tồn tại thì ném DuplicateResourceException")
    void createDuplicateEmail() {
        when(userRepository.existsByEmail(user.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> userService.create(user))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists with email");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("findById() — tìm thấy user")
    void findByIdFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        User found = userService.findById(1L);

        assertThat(found.getFullName()).isEqualTo("Nguyen Van A");
    }

    @Test
    @DisplayName("findById() — không tìm thấy ném ResourceNotFoundException")
    void findByIdNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with id");
    }

    @Test
    @DisplayName("findByEmail() — tìm thấy user")
    void findByEmailFound() {
        when(userRepository.findByEmail("nguyenvana@example.com")).thenReturn(Optional.of(user));

        User found = userService.findByEmail("nguyenvana@example.com");

        assertThat(found.getEmail()).isEqualTo("nguyenvana@example.com");
    }

    @Test
    @DisplayName("findByEmail() — không tìm thấy ném ResourceNotFoundException")
    void findByEmailNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByEmail("unknown@example.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found with email");
    }

    @Test
    @DisplayName("findAll() — trả về tất cả user")
    void findAll() {
        when(userRepository.findAll()).thenReturn(List.of(user));

        List<User> users = userService.findAll();

        assertThat(users).hasSize(1);
    }

    @Test
    @DisplayName("findAllByStatus() — lọc theo trạng thái")
    void findAllByStatus() {
        when(userRepository.findByStatus(UserStatus.ACTIVE)).thenReturn(List.of(user));

        List<User> users = userService.findAllByStatus(UserStatus.ACTIVE);

        assertThat(users).hasSize(1);
        assertThat(users.get(0).getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("findAllByRole() — lọc theo role")
    void findAllByRole() {
        when(userRepository.findByRole(Role.STUDENT)).thenReturn(List.of(user));

        List<User> users = userService.findAllByRole(Role.STUDENT);

        assertThat(users).hasSize(1);
        assertThat(users.get(0).getRole()).isEqualTo(Role.STUDENT);
    }

    @Test
    @DisplayName("update() — cập nhật user thành công")
    void updateSuccess() {
        User updatedUser = User.builder()
                .email("newemail@example.com")
                .fullName("Nguyen Van A Updated")
                .phone("0999999999")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("newemail@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.update(1L, updatedUser);

        assertThat(result.getEmail()).isEqualTo("newemail@example.com");
        assertThat(result.getFullName()).isEqualTo("Nguyen Van A Updated");
        assertThat(result.getPhone()).isEqualTo("0999999999");
    }

    @Test
    @DisplayName("update() — email mới bị trùng ném DuplicateResourceException")
    void updateDuplicateEmail() {
        User updatedUser = User.builder()
                .email("existing@example.com")
                .fullName("Nguyen Van A Updated")
                .phone("0999999999")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.update(1L, updatedUser))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists with email");
    }

    @Test
    @DisplayName("update() — giữ nguyên email cũ không check trùng")
    void updateSameEmail() {
        User updatedUser = User.builder()
                .email("nguyenvana@example.com")
                .fullName("Nguyen Van A Updated")
                .phone("0999999999")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.update(1L, updatedUser);

        assertThat(result.getFullName()).isEqualTo("Nguyen Van A Updated");
        verify(userRepository, never()).existsByEmail("nguyenvana@example.com");
    }

    @Test
    @DisplayName("delete() — set status thành INACTIVE")
    void delete() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        userService.delete(1L);

        assertThat(user.getStatus()).isEqualTo(UserStatus.INACTIVE);
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("delete() — user không tồn tại ném ResourceNotFoundException")
    void deleteNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
