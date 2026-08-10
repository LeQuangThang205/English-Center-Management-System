package com.englishcenter.repository;

import com.englishcenter.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    Optional<StudentProfile> findByUser_Email(String email);

    Optional<StudentProfile> findByUser_Id(Long userId);
}
