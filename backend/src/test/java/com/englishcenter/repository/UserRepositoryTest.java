package com.englishcenter.repository;

import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User teacherUser;
    private User studentUser;

    @BeforeEach
    void setUp() {
        teacherUser = User.builder()
                .fullName("Tran Thi B")
                .email("tranthib@example.com")
                .passwordHash("hashedPassword456")
                .phone("0987654321")
                .role(Role.TEACHER)
                .status(UserStatus.ACTIVE)
                .build();
        teacherUser = userRepository.save(teacherUser);

        studentUser = User.builder()
                .fullName("Le Van C")
                .email("levanc@example.com")
                .passwordHash("hashedPassword789")
                .phone("0912345678")
                .role(Role.STUDENT)
                .status(UserStatus.INACTIVE)
                .build();
        studentUser = userRepository.save(studentUser);
    }

    @Test
    @DisplayName("save() — trả về entity có id và timestamp")
    void save() {
        assertThat(teacherUser.getId()).isNotNull();
        assertThat(teacherUser.getCreatedAt()).isNotNull();
        assertThat(teacherUser.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("findByEmail() — tìm thấy user theo email")
    void findByEmailFound() {
        Optional<User> found = userRepository.findByEmail("tranthib@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Tran Thi B");
    }

    @Test
    @DisplayName("findByEmail() — không tìm thấy trả về empty")
    void findByEmailNotFound() {
        Optional<User> found = userRepository.findByEmail("notfound@example.com");
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("existsByEmail() — kiểm tra email tồn tại / không tồn tại")
    void existsByEmail() {
        assertThat(userRepository.existsByEmail("tranthib@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("levanc@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("unknown@example.com")).isFalse();
    }

    @Test
    @DisplayName("findByStatus() — lọc user theo trạng thái")
    void findByStatus() {
        List<User> activeUsers = userRepository.findByStatus(UserStatus.ACTIVE);
        assertThat(activeUsers).hasSize(1);
        assertThat(activeUsers.get(0).getEmail()).isEqualTo("tranthib@example.com");

        List<User> inactiveUsers = userRepository.findByStatus(UserStatus.INACTIVE);
        assertThat(inactiveUsers).hasSize(1);
        assertThat(inactiveUsers.get(0).getEmail()).isEqualTo("levanc@example.com");
    }

    @Test
    @DisplayName("findByFullNameContaining() — tìm user theo keyword trong tên")
    void findByFullNameContaining() {
        List<User> results = userRepository.findByFullNameContaining("Thi B");
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getEmail()).isEqualTo("tranthib@example.com");
    }

    @Test
    @DisplayName("findByFullNameContaining() — không tìm thấy trả về danh sách rỗng")
    void findByFullNameContainingNotFound() {
        List<User> results = userRepository.findByFullNameContaining("ZZZ");
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("findByRole() — lọc user theo role")
    void findByRole() {
        List<User> teachers = userRepository.findByRole(Role.TEACHER);
        assertThat(teachers).hasSize(1);
        assertThat(teachers.get(0).getEmail()).isEqualTo("tranthib@example.com");

        List<User> students = userRepository.findByRole(Role.STUDENT);
        assertThat(students).hasSize(1);
        assertThat(students.get(0).getEmail()).isEqualTo("levanc@example.com");

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        assertThat(admins).isEmpty();
    }

    @Test
    @DisplayName("save() — cập nhật user đã tồn tại")
    void update() {
        teacherUser.setPhone("0999999999");
        teacherUser.setFullName("Tran Thi B Updated");
        userRepository.save(teacherUser);

        User updated = userRepository.findById(teacherUser.getId()).orElseThrow();
        assertThat(updated.getPhone()).isEqualTo("0999999999");
        assertThat(updated.getFullName()).isEqualTo("Tran Thi B Updated");
        assertThat(updated.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("deleteById() — xóa user khỏi database")
    void delete() {
        userRepository.deleteById(studentUser.getId());

        Optional<User> deleted = userRepository.findById(studentUser.getId());
        assertThat(deleted).isEmpty();
    }
}
