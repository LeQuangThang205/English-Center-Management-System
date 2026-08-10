package com.englishcenter.repository;

import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.enums.ClassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseClassRepository extends JpaRepository<CourseClass, Long> {

    List<CourseClass> findByCourse_Id(Long courseId);

    List<CourseClass> findByTeacher_Id(Long teacherId);

    List<CourseClass> findByStatus(ClassStatus status);
}
