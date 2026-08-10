package com.englishcenter.service.impl;

import com.englishcenter.entity.StudentProfile;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.StudentProfileRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.service.StudentProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentProfileServiceImpl implements StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public StudentProfile create(StudentProfile profile) {
        User user = userRepository.findById(profile.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", profile.getUser().getId()));

        if (user.getRole() != Role.STUDENT) {
            throw new BusinessException("User must have role STUDENT to create a student profile");
        }

        if (studentProfileRepository.findByUser_Id(user.getId()).isPresent()) {
            throw new BusinessException("Student profile already exists for user id: " + user.getId());
        }

        profile.setUser(user);
        user.setStudentProfile(profile);
        return studentProfileRepository.save(profile);
    }

    @Override
    public StudentProfile findByUserId(Long userId) {
        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "user_id", String.valueOf(userId)));
    }

    @Override
    public StudentProfile findByEmail(String email) {
        return studentProfileRepository.findByUser_Email(email)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "email", email));
    }

    @Override
    public List<StudentProfile> findAll() {
        return studentProfileRepository.findAll();
    }

    @Override
    @Transactional
    public StudentProfile update(Long userId, StudentProfile profile) {
        StudentProfile existing = findByUserId(userId);
        existing.setDateOfBirth(profile.getDateOfBirth());
        existing.setAddress(profile.getAddress());
        existing.setEnrollmentDate(profile.getEnrollmentDate());
        return studentProfileRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long userId) {
        StudentProfile profile = findByUserId(userId);
        User user = profile.getUser();
        user.setStudentProfile(null);
        studentProfileRepository.delete(profile);
    }

    @Override
    public List<StudentProfile> findAll(User currentUser) {
        if (isAdmin(currentUser)) {
            return findAll();
        }
        return List.of(findByUserId(currentUser.getId()));
    }

    @Override
    public StudentProfile findByUserId(Long userId, User currentUser) {
        checkSelfOrAdmin(currentUser, userId);
        return findByUserId(userId);
    }

    @Override
    public StudentProfile findByEmail(String email, User currentUser) {
        StudentProfile profile = findByEmail(email);
        checkSelfOrAdmin(currentUser, profile.getUserId());
        return profile;
    }

    @Override
    @Transactional
    public StudentProfile create(StudentProfile profile, User currentUser) {
        if (!isAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }
        return create(profile);
    }

    @Override
    @Transactional
    public StudentProfile update(Long userId, StudentProfile profile, User currentUser) {
        checkSelfOrAdmin(currentUser, userId);
        return update(userId, profile);
    }

    @Override
    @Transactional
    public void delete(Long userId, User currentUser) {
        if (!isAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }
        delete(userId);
    }

    private boolean isAdmin(User currentUser) {
        return currentUser.getRole() == Role.ADMIN;
    }

    private void checkSelfOrAdmin(User currentUser, Long targetUserId) {
        if (!isAdmin(currentUser) && !currentUser.getId().equals(targetUserId)) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
