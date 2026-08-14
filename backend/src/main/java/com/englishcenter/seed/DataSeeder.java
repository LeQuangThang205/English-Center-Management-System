package com.englishcenter.seed;

import com.englishcenter.entity.StudentProfile;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.StudentProfileRepository;
import com.englishcenter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@Profile("seed")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final String SEED_ADMIN_EMAIL = "admin@example.com";
    private static final String SEED_PASSWORD = "password123";

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (isAlreadySeeded()) {
            log.info("Seed data already present; skipping seed generation");
            return;
        }
        log.info("Starting seed data generation");
        seedUsersAndProfiles();
        log.info("Finished seed data generation");
    }

    private boolean isAlreadySeeded() {
        return userRepository.existsByEmail(SEED_ADMIN_EMAIL);
    }

    private void seedUsersAndProfiles() {
        seedUser(SEED_ADMIN_EMAIL, "Quan tri vien", Role.ADMIN, UserStatus.ACTIVE, null);

        seedUser("teacher1@example.com", "Nguyen Van Minh", Role.TEACHER, UserStatus.ACTIVE, "0901122334");
        seedUser("teacher2@example.com", "Tran Thi Lan", Role.TEACHER, UserStatus.ACTIVE, "0902233445");

        seedStudent("student1@example.com", "Le Van An", LocalDate.of(2006, 3, 12), "Ha Noi", "0903344556");
        seedStudent("student2@example.com", "Pham Thi Binh", LocalDate.of(2005, 8, 25), "Hai Phong", "0904455667");
        seedStudent("student3@example.com", "Hoang Van Cuong", LocalDate.of(2007, 1, 5), "Da Nang", "0905566778");
        seedStudent("student4@example.com", "Vu Thi Dung", LocalDate.of(2006, 11, 18), "Hue", "0906677889");
        seedStudent("student5@example.com", "Do Van Em", LocalDate.of(2005, 5, 30), "TP HCM", "0907788990");

        User inactiveStudent = seedUser(
                "student-inactive@example.com", "Ngo Van F", Role.STUDENT, UserStatus.INACTIVE, "0908899001");
        seedProfile(inactiveStudent, LocalDate.of(2004, 9, 9), "Can Tho");
    }

    private User seedUser(String email, String fullName, Role role, UserStatus status, String phone) {
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(SEED_PASSWORD))
                .fullName(fullName)
                .phone(phone)
                .role(role)
                .status(status)
                .build();
        return userRepository.save(user);
    }

    private void seedStudent(String email, String fullName, LocalDate dateOfBirth, String address, String phone) {
        seedProfile(seedUser(email, fullName, Role.STUDENT, UserStatus.ACTIVE, phone), dateOfBirth, address);
    }

    private void seedProfile(User user, LocalDate dateOfBirth, String address) {
        StudentProfile profile = StudentProfile.builder()
                .user(user)
                .dateOfBirth(dateOfBirth)
                .address(address)
                .enrollmentDate(LocalDate.now())
                .build();
        studentProfileRepository.save(profile);
    }
}