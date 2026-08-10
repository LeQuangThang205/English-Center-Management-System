package com.englishcenter.service;

import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.RegistrationStatus;

import java.util.List;

public interface RegistrationService {

    Registration create(Registration registration);

    Registration findById(Long id);

    List<Registration> findAll();

    List<Registration> findAllByStudentId(Long studentId);

    List<Registration> findAllByClassId(Long classId);

    List<Registration> findAllByStatus(RegistrationStatus status);

    List<Registration> findAll(Long studentId, Long classId, RegistrationStatus status);

    Registration approve(Long id, Long approverId);

    Registration reject(Long id, Long rejecterId, String reason);

    Registration cancel(Long id);

    Registration markPaid(Long id);

    Registration create(Registration registration, User currentUser);

    Registration approve(Long id, User currentUser);

    Registration reject(Long id, String reason, User currentUser);

    Registration cancel(Long id, User currentUser);

    Registration markPaid(Long id, User currentUser);
}
