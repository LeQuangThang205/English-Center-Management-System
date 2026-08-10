package com.englishcenter.repository;

import com.englishcenter.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {

    Optional<Score> findByStudent_IdAndCourseClass_Id(Long studentId, Long classId);

    List<Score> findByStudent_Id(Long studentId);

    List<Score> findByCourseClass_Id(Long classId);

    List<Score> findByCourseClass_Teacher_Id(Long teacherId);
}
