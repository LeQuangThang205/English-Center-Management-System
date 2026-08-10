package com.englishcenter.service;

import com.englishcenter.entity.StudentProfile;
import com.englishcenter.entity.User;

import java.util.List;

public interface StudentProfileService {

    StudentProfile create(StudentProfile profile);

    StudentProfile findByUserId(Long userId);

    StudentProfile findByEmail(String email);

    List<StudentProfile> findAll();

    StudentProfile update(Long userId, StudentProfile profile);

    void delete(Long userId);

    List<StudentProfile> findAll(User currentUser);

    StudentProfile findByUserId(Long userId, User currentUser);

    StudentProfile findByEmail(String email, User currentUser);

    StudentProfile create(StudentProfile profile, User currentUser);

    StudentProfile update(Long userId, StudentProfile profile, User currentUser);

    void delete(Long userId, User currentUser);
}
