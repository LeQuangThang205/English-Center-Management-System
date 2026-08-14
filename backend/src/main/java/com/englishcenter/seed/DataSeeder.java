package com.englishcenter.seed;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.StudentProfile;
import com.englishcenter.entity.Transaction;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.ScheduleDay;
import com.englishcenter.entity.enums.TransactionStatus;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.CourseRepository;
import com.englishcenter.repository.RegistrationRepository;
import com.englishcenter.repository.StudentProfileRepository;
import com.englishcenter.repository.TransactionRepository;
import com.englishcenter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
@Profile("seed")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final String SEED_ADMIN_EMAIL = "admin@example.com";
    private static final String SEED_PASSWORD = "password123";
    private static final String TEACHER1_EMAIL = "teacher1@example.com";
    private static final String TEACHER2_EMAIL = "teacher2@example.com";

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CourseRepository courseRepository;
    private final CourseClassRepository courseClassRepository;
    private final RegistrationRepository registrationRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    private int transactionSequence = 0;

    @Override
    @Transactional
    public void run(String... args) {
        if (isAlreadySeeded()) {
            log.info("Seed data already present; skipping seed generation");
            return;
        }
        log.info("Starting seed data generation");
        seedUsersAndProfiles();
        seedCoursesAndClasses();
        seedRegistrationsAndTransactions();
        log.info("Finished seed data generation");
    }

    private boolean isAlreadySeeded() {
        return userRepository.existsByEmail(SEED_ADMIN_EMAIL);
    }

    private void seedUsersAndProfiles() {
        seedUser(SEED_ADMIN_EMAIL, "Quan tri vien", Role.ADMIN, UserStatus.ACTIVE, null);

        seedUser(TEACHER1_EMAIL, "Nguyen Van Minh", Role.TEACHER, UserStatus.ACTIVE, "0901122334");
        seedUser(TEACHER2_EMAIL, "Tran Thi Lan", Role.TEACHER, UserStatus.ACTIVE, "0902233445");

        seedStudent("student1@example.com", "Le Van An", LocalDate.of(2006, 3, 12), "Ha Noi", "0903344556");
        seedStudent("student2@example.com", "Pham Thi Binh", LocalDate.of(2005, 8, 25), "Hai Phong", "0904455667");
        seedStudent("student3@example.com", "Hoang Van Cuong", LocalDate.of(2007, 1, 5), "Da Nang", "0905566778");
        seedStudent("student4@example.com", "Vu Thi Dung", LocalDate.of(2006, 11, 18), "Hue", "0906677889");
        seedStudent("student5@example.com", "Do Van Em", LocalDate.of(2005, 5, 30), "TP HCM", "0907788990");

        User inactiveStudent = seedUser(
                "student-inactive@example.com", "Ngo Van F", Role.STUDENT, UserStatus.INACTIVE, "0908899001");
        seedProfile(inactiveStudent, LocalDate.of(2004, 9, 9), "Can Tho");
    }

    private void seedCoursesAndClasses() {
        Course beginner = seedCourse(
                "English Foundation", CourseLevel.BEGINNER, new BigDecimal("1500000.00"), 24,
                "Khoa hoc tieng Anh co ban cho nguoi moi bat dau");
        Course intermediate = seedCourse(
                "English Communication", CourseLevel.INTERMEDIATE, new BigDecimal("1800000.00"), 24,
                "Khoa hoc giao tiep tieng Anh trung cap");
        Course advanced = seedCourse(
                "IELTS Advanced", CourseLevel.ADVANCED, new BigDecimal("2200000.00"), 18,
                "Khoa hoc luyen thi IELTS nang cao");

        User teacher1 = userRepository.findByEmail(TEACHER1_EMAIL).orElseThrow();
        User teacher2 = userRepository.findByEmail(TEACHER2_EMAIL).orElseThrow();

        LocalDate now = LocalDate.now();

        seedClass("Beginner Class A", beginner, teacher1, ClassStatus.UPCOMING, 20, 0,
                ScheduleDay.MON, LocalTime.of(18, 0), LocalTime.of(20, 0), "Room 101",
                now.plusMonths(1), now.plusMonths(3));
        seedClass("Beginner Class B", beginner, teacher2, ClassStatus.STUDYING, 20, 12,
                ScheduleDay.WED, LocalTime.of(18, 0), LocalTime.of(20, 0), "Room 102",
                now.minusMonths(1), now.plusMonths(2));
        seedClass("Intermediate Class A", intermediate, teacher1, ClassStatus.STUDYING, 25, 15,
                ScheduleDay.TUE, LocalTime.of(19, 0), LocalTime.of(21, 0), "Room 201",
                now.minusMonths(2), now.plusMonths(1));
        seedClass("Intermediate Class B", intermediate, teacher2, ClassStatus.FINISHED, 25, 18,
                ScheduleDay.THU, LocalTime.of(19, 0), LocalTime.of(21, 0), "Room 202",
                now.minusMonths(6), now.minusMonths(3));
        seedClass("Advanced Class A", advanced, teacher1, ClassStatus.FINISHED, 15, 10,
                ScheduleDay.SAT, LocalTime.of(9, 0), LocalTime.of(11, 0), "Room 301",
                now.minusMonths(8), now.minusMonths(5));
        seedClass("Advanced Class B", advanced, teacher2, ClassStatus.CANCELLED, 15, 0,
                ScheduleDay.FRI, LocalTime.of(19, 0), LocalTime.of(21, 0), "Room 302",
                now.minusMonths(2), now.plusMonths(2));
    }

    private void seedRegistrationsAndTransactions() {
        User admin = userRepository.findByEmail(SEED_ADMIN_EMAIL).orElseThrow();

        User student1 = findUser("student1@example.com");
        User student2 = findUser("student2@example.com");
        User student3 = findUser("student3@example.com");
        User student4 = findUser("student4@example.com");
        User student5 = findUser("student5@example.com");

        CourseClass beginnerA = findClassByName("Beginner Class A");
        CourseClass beginnerB = findClassByName("Beginner Class B");
        CourseClass intermediateA = findClassByName("Intermediate Class A");
        CourseClass advancedA = findClassByName("Advanced Class A");

        Registration r1 = seedRegistration(student1, beginnerB, RegistrationStatus.APPROVED, admin);
        Registration r2 = seedRegistration(student2, beginnerB, RegistrationStatus.APPROVED, admin);
        Registration r3 = seedRegistration(student3, beginnerB, RegistrationStatus.PAID, admin);
        seedRegistration(student3, intermediateA, RegistrationStatus.APPROVED, admin);
        Registration r5 = seedRegistration(student4, intermediateA, RegistrationStatus.PAID, admin);
        Registration r6 = seedRegistration(student5, intermediateA, RegistrationStatus.APPROVED, admin);
        seedRegistration(student1, beginnerA, RegistrationStatus.PENDING, admin);
        seedRegistration(student2, beginnerA, RegistrationStatus.PENDING, admin);
        seedRegistration(student5, advancedA, RegistrationStatus.REJECTED, admin);

        seedTransaction(r1, TransactionStatus.FAILED, admin);
        seedTransaction(r2, TransactionStatus.PENDING_CONFIRMATION, admin);
        seedTransaction(r3, TransactionStatus.SUCCESS, admin);
        seedTransaction(r5, TransactionStatus.SUCCESS, admin);
        seedTransaction(r6, TransactionStatus.PENDING_CONFIRMATION, admin);
    }

    private Registration seedRegistration(User student, CourseClass courseClass,
                                          RegistrationStatus status, User admin) {
        LocalDateTime now = LocalDateTime.now();
        Registration.RegistrationBuilder builder = Registration.builder()
                .student(student)
                .courseClass(courseClass)
                .status(status)
                .tuitionAtRegistration(courseClass.getCourse().getTuition())
                .registeredAt(now);
        switch (status) {
            case APPROVED -> {
                builder.approvedAt(now);
                builder.approvedBy(admin);
            }
            case PAID -> {
                builder.approvedAt(now);
                builder.approvedBy(admin);
                builder.paidAt(now);
            }
            case REJECTED -> {
                builder.rejectedAt(now);
                builder.rejectedBy(admin);
                builder.rejectionReason("Class is full");
            }
            default -> {
            }
        }
        return registrationRepository.save(builder.build());
    }

    private void seedTransaction(Registration registration, TransactionStatus status, User admin) {
        LocalDateTime now = LocalDateTime.now();
        Transaction.TransactionBuilder builder = Transaction.builder()
                .registration(registration)
                .amount(registration.getTuitionAtRegistration())
                .transactionCode(nextTransactionCode())
                .status(status);
        switch (status) {
            case SUCCESS -> {
                builder.paidAt(now);
                builder.confirmedAt(now);
                builder.confirmedBy(admin);
            }
            case PENDING_CONFIRMATION -> builder.paidAt(now);
            case FAILED -> {
            }
        }
        transactionRepository.save(builder.build());
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email).orElseThrow();
    }

    private CourseClass findClassByName(String name) {
        return courseClassRepository.findAll().stream()
                .filter(courseClass -> courseClass.getName().equals(name))
                .findFirst()
                .orElseThrow();
    }

    private String nextTransactionCode() {
        transactionSequence++;
        return "TXN-" + String.format("%06d", transactionSequence);
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

    private Course seedCourse(String name, CourseLevel level, BigDecimal tuition, int duration, String description) {
        Course course = Course.builder()
                .name(name)
                .description(description)
                .tuition(tuition)
                .level(level)
                .duration(duration)
                .status(CourseStatus.ACTIVE)
                .build();
        return courseRepository.save(course);
    }

    private void seedClass(String name, Course course, User teacher, ClassStatus status,
                           int maxCapacity, int currentHeadcount, ScheduleDay scheduleDay,
                           LocalTime startTime, LocalTime endTime, String room,
                           LocalDate startDate, LocalDate endDate) {
        CourseClass courseClass = CourseClass.builder()
                .course(course)
                .name(name)
                .teacher(teacher)
                .maxCapacity(maxCapacity)
                .currentHeadcount(currentHeadcount)
                .scheduleDay(scheduleDay)
                .startTime(startTime)
                .endTime(endTime)
                .room(room)
                .startDate(startDate)
                .endDate(endDate)
                .status(status)
                .build();
        courseClassRepository.save(courseClass);
    }
}