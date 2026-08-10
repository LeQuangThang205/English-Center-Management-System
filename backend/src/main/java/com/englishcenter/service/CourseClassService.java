package com.englishcenter.service;

import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;

import java.util.List;

public interface CourseClassService {

    CourseClass create(CourseClass courseClass);

    CourseClass findById(Long id);

    List<CourseClass> findAll();

    List<CourseClass> findAllByCourseId(Long courseId);

    List<CourseClass> findAllByTeacherId(Long teacherId);

    List<CourseClass> findAllByStatus(ClassStatus status);

    CourseClass update(Long id, CourseClass courseClass);

    void delete(Long id);

    CourseClass create(CourseClass courseClass, User currentUser);

    CourseClass update(Long id, CourseClass courseClass, User currentUser);

    void delete(Long id, User currentUser);
}
