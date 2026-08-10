package com.englishcenter.service.impl;

import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.RegistrationRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final CourseClassRepository courseClassRepository;

    @Override
    @Transactional
    public Registration create(Registration registration) {
        User student = userRepository.findById(registration.getStudent().getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", registration.getStudent().getId()));

        if (student.getRole() != Role.STUDENT) {
            throw new BusinessException("Only users with role STUDENT can register");
        }

        CourseClass courseClass = courseClassRepository.findById(registration.getCourseClass().getId())
                .orElseThrow(() -> new ResourceNotFoundException("CourseClass", registration.getCourseClass().getId()));

        if (courseClass.getStatus() == ClassStatus.CANCELLED || courseClass.getStatus() == ClassStatus.FINISHED) {
            throw new BusinessException("Cannot register for a " + courseClass.getStatus() + " class");
        }

        registration.setStudent(student);
        registration.setCourseClass(courseClass);
        registration.setTuitionAtRegistration(courseClass.getCourse().getTuition());
        registration.setStatus(RegistrationStatus.PENDING);
        registration.setRegisteredAt(LocalDateTime.now());

        return registrationRepository.save(registration);
    }

    @Override
    public Registration findById(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", id));
    }

    @Override
    public List<Registration> findAll() {
        return registrationRepository.findAll();
    }

    @Override
    public List<Registration> findAllByStudentId(Long studentId) {
        return registrationRepository.findByStudent_Id(studentId);
    }

    @Override
    public List<Registration> findAllByClassId(Long classId) {
        return registrationRepository.findByCourseClass_Id(classId);
    }

    @Override
    public List<Registration> findAllByStatus(RegistrationStatus status) {
        return registrationRepository.findByStatus(status);
    }

    @Override
    @Transactional
    public Registration approve(Long id, Long approverId) {
        Registration registration = findById(id);
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", approverId));

        if (registration.getStatus() != RegistrationStatus.PENDING) {
            throw new BusinessException("Only PENDING registrations can be approved");
        }

        CourseClass courseClass = registration.getCourseClass();
        if (courseClass.getCurrentHeadcount() >= courseClass.getMaxCapacity()) {
            throw new BusinessException("Class is already at full capacity");
        }

        registration.setStatus(RegistrationStatus.APPROVED);
        registration.setApprovedBy(approver);
        registration.setApprovedAt(LocalDateTime.now());

        courseClass.setCurrentHeadcount(courseClass.getCurrentHeadcount() + 1);
        courseClassRepository.save(courseClass);

        return registrationRepository.save(registration);
    }

    @Override
    @Transactional
    public Registration reject(Long id, Long rejecterId, String reason) {
        Registration registration = findById(id);
        User rejecter = userRepository.findById(rejecterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", rejecterId));

        if (registration.getStatus() != RegistrationStatus.PENDING) {
            throw new BusinessException("Only PENDING registrations can be rejected");
        }

        registration.setStatus(RegistrationStatus.REJECTED);
        registration.setRejectedBy(rejecter);
        registration.setRejectedAt(LocalDateTime.now());
        registration.setRejectionReason(reason);

        return registrationRepository.save(registration);
    }

    @Override
    @Transactional
    public Registration cancel(Long id) {
        Registration registration = findById(id);

        if (registration.getStatus() == RegistrationStatus.PAID) {
            throw new BusinessException("Cannot cancel a PAID registration");
        }

        boolean wasApproved = registration.getStatus() == RegistrationStatus.APPROVED;

        registration.setStatus(RegistrationStatus.CANCELLED);

        if (wasApproved) {
            CourseClass courseClass = registration.getCourseClass();
            courseClass.setCurrentHeadcount(courseClass.getCurrentHeadcount() - 1);
            courseClassRepository.save(courseClass);
        }

        return registrationRepository.save(registration);
    }

    @Override
    @Transactional
    public Registration markPaid(Long id) {
        Registration registration = findById(id);

        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            throw new BusinessException("Only APPROVED registrations can be marked as paid");
        }

        registration.setStatus(RegistrationStatus.PAID);
        registration.setPaidAt(LocalDateTime.now());

        return registrationRepository.save(registration);
    }

    @Override
    @Transactional
    public Registration create(Registration registration, User currentUser) {
        if (currentUser.getRole() != Role.STUDENT
                || !currentUser.getId().equals(registration.getStudent().getId())) {
            throw new AccessDeniedException("Access denied");
        }
        return create(registration);
    }

    @Override
    public List<Registration> findAll(Long studentId, Long classId, RegistrationStatus status) {
        if (studentId != null) {
            return findAllByStudentId(studentId);
        }
        if (classId != null) {
            return findAllByClassId(classId);
        }
        if (status != null) {
            return findAllByStatus(status);
        }
        return findAll();
    }

    @Override
    @Transactional
    public Registration approve(Long id, User currentUser) {
        requireAdmin(currentUser);
        return approve(id, currentUser.getId());
    }

    @Override
    @Transactional
    public Registration reject(Long id, String reason, User currentUser) {
        requireAdmin(currentUser);
        return reject(id, currentUser.getId(), reason);
    }

    @Override
    @Transactional
    public Registration cancel(Long id, User currentUser) {
        Registration registration = findById(id);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwner = currentUser.getRole() == Role.STUDENT
                && registration.getStudent().getId().equals(currentUser.getId());
        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Access denied");
        }
        return cancel(id);
    }

    @Override
    @Transactional
    public Registration markPaid(Long id, User currentUser) {
        requireAdmin(currentUser);
        return markPaid(id);
    }

    private void requireAdmin(User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
