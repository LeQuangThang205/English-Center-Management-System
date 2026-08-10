package com.englishcenter.service.impl;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.enums.CourseLevel;
import com.englishcenter.entity.enums.CourseStatus;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.CourseRepository;
import com.englishcenter.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;

    @Override
    @Transactional
    public Course create(Course course) {
        return courseRepository.save(course);
    }

    @Override
    public Course findById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
    }

    @Override
    public List<Course> findAll() {
        return courseRepository.findAll();
    }

    @Override
    public List<Course> findAllByStatus(CourseStatus status) {
        return courseRepository.findByStatus(status);
    }

    @Override
    public List<Course> findAllByLevel(CourseLevel level) {
        return courseRepository.findByLevel(level);
    }

    @Override
    @Transactional
    public Course update(Long id, Course course) {
        Course existing = findById(id);
        existing.setName(course.getName());
        existing.setDescription(course.getDescription());
        existing.setTuition(course.getTuition());
        existing.setLevel(course.getLevel());
        existing.setDuration(course.getDuration());
        existing.setStatus(course.getStatus());
        return courseRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Course course = findById(id);
        course.setStatus(CourseStatus.DELETED);
        courseRepository.save(course);
    }
}
