package com.englishcenter.service;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;

import java.util.List;

public interface CourseService {

    Course create(Course course);

    Course findById(Long id);

    List<Course> findAll();

    List<Course> findAllByStatus(CourseStatus status);

    List<Course> findAllByLevel(CourseLevel level);

    Course update(Long id, Course course);

    void delete(Long id);
}
