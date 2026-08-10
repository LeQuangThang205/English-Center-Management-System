package com.englishcenter.repository;

import com.englishcenter.entity.StudentProfile;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class StudentProfileRepositoryTest {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private UserRepository userRepository;

    private User user;
    private StudentProfile studentProfile;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .fullName("Nguyen Van A")
                .email("nguyenvana@example.com")
                .passwordHash("hashedPassword123")
                .phone("0123456789")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        studentProfile = StudentProfile.builder()
                .user(user)
                .dateOfBirth(LocalDate.of(2000, 1, 15))
                .address("Ha Noi")
                .enrollmentDate(LocalDate.now())
                .build();
        user.setStudentProfile(studentProfile);
        studentProfile = studentProfileRepository.save(studentProfile);
    }

    @Test
    @DisplayName("Create student — save() trả về entity có id")
    void createStudent() {
        assertThat(user.getId()).isNotNull();
        assertThat(studentProfile.getUserId()).isEqualTo(user.getId());
        assertThat(user.getFullName()).isEqualTo("Nguyen Van A");
        assertThat(user.getEmail()).isEqualTo("nguyenvana@example.com");
        assertThat(user.getCreatedAt()).isNotNull();
        assertThat(user.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Read student — findById() tìm theo id")
    void readStudentById() {
        Optional<User> foundUser = userRepository.findById(user.getId());
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getFullName()).isEqualTo("Nguyen Van A");

        Optional<StudentProfile> foundProfile = studentProfileRepository.findById(studentProfile.getUserId());
        assertThat(foundProfile).isPresent();
        assertThat(foundProfile.get().getAddress()).isEqualTo("Ha Noi");
    }

    @Test
    @DisplayName("Read student — findByEmail() dùng custom method")
    void readStudentByEmail() {
        Optional<User> found = userRepository.findByEmail("nguyenvana@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("nguyenvana@example.com");
    }

    @Test
    @DisplayName("Read student — findByStatus() trả về danh sách")
    void readStudentsByStatus() {
        List<User> activeUsers = userRepository.findByStatus(UserStatus.ACTIVE);
        assertThat(activeUsers).isNotEmpty();
        assertThat(activeUsers.get(0).getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("Read student — findByFullNameContaining() tìm theo từ khóa")
    void readStudentByFullNameContaining() {
        List<User> results = userRepository.findByFullNameContaining("Van A");
        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getFullName()).contains("Van A");
    }

    @Test
    @DisplayName("Update student — save() với id đã tồn tại sẽ UPDATE")
    void updateStudent() {
        user.setPhone("0999999999");
        userRepository.save(user);

        studentProfile.setAddress("Ho Chi Minh City");
        studentProfileRepository.save(studentProfile);

        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.getPhone()).isEqualTo("0999999999");
        assertThat(updatedUser.getFullName()).isEqualTo("Nguyen Van A");

        StudentProfile updatedProfile = studentProfileRepository.findById(studentProfile.getUserId()).orElseThrow();
        assertThat(updatedProfile.getAddress()).isEqualTo("Ho Chi Minh City");
    }

    @Test
    @DisplayName("Delete student — deleteById() xóa khỏi database")
    void deleteStudent() {
        userRepository.deleteById(user.getId());

        Optional<User> deletedUser = userRepository.findById(user.getId());
        assertThat(deletedUser).isEmpty();

        Optional<StudentProfile> deletedProfile = studentProfileRepository.findById(studentProfile.getUserId());
        assertThat(deletedProfile).isEmpty();
    }

    @Test
    @DisplayName("existsByEmail() — kiểm tra email tồn tại")
    void existsByEmail() {
        boolean exists = userRepository.existsByEmail("nguyenvana@example.com");
        boolean notExists = userRepository.existsByEmail("unknown@example.com");

        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }
}
