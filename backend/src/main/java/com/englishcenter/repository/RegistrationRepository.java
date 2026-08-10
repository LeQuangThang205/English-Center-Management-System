package com.englishcenter.repository;

import com.englishcenter.entity.Registration;
import com.englishcenter.entity.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudent_Id(Long studentId);

    List<Registration> findByCourseClass_Id(Long classId);

    List<Registration> findByStatus(RegistrationStatus status);
}
