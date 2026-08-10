package com.englishcenter.service.impl;

import com.englishcenter.entity.Course;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.repository.CourseRepository;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.service.CourseClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseClassServiceImpl implements CourseClassService {

    private final CourseClassRepository courseClassRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CourseClass create(CourseClass courseClass) {
        Course course = courseRepository.findById(courseClass.getCourse().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseClass.getCourse().getId()));

        if (courseClass.getMaxCapacity() <= 0) {
            throw new BusinessException("maxCapacity must be greater than 0");
        }

        if (courseClass.getStartDate().isAfter(courseClass.getEndDate())) {
            throw new BusinessException("startDate must be before endDate");
        }

        if (!courseClass.getStartTime().isBefore(courseClass.getEndTime())) {
            throw new BusinessException("startTime must be before endTime");
        }

        courseClass.setCourse(course);

        if (courseClass.getTeacher() != null && courseClass.getTeacher().getId() != null) {
            User teacher = userRepository.findById(courseClass.getTeacher().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", courseClass.getTeacher().getId()));
            courseClass.setTeacher(teacher);
        }

        return courseClassRepository.save(courseClass);
    }

    @Override
    public CourseClass findById(Long id) {
        return courseClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseClass", id));
    }

    @Override
    public List<CourseClass> findAll() {
        return courseClassRepository.findAll();
    }

    @Override
    public List<CourseClass> findAllByCourseId(Long courseId) {
        return courseClassRepository.findByCourse_Id(courseId);
    }

    @Override
    public List<CourseClass> findAllByTeacherId(Long teacherId) {
        return courseClassRepository.findByTeacher_Id(teacherId);
    }

    @Override
    public List<CourseClass> findAllByStatus(ClassStatus status) {
        return courseClassRepository.findByStatus(status);
    }

    @Override
    @Transactional
    public CourseClass update(Long id, CourseClass courseClass) {
        CourseClass existing = findById(id);
        existing.setName(courseClass.getName());
        existing.setMaxCapacity(courseClass.getMaxCapacity());
        existing.setScheduleDay(courseClass.getScheduleDay());
        existing.setStartTime(courseClass.getStartTime());
        existing.setEndTime(courseClass.getEndTime());
        existing.setRoom(courseClass.getRoom());
        existing.setStartDate(courseClass.getStartDate());
        existing.setEndDate(courseClass.getEndDate());
        existing.setStatus(courseClass.getStatus());

        if (courseClass.getTeacher() != null && courseClass.getTeacher().getId() != null) {
            User teacher = userRepository.findById(courseClass.getTeacher().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", courseClass.getTeacher().getId()));
            existing.setTeacher(teacher);
        } else {
            existing.setTeacher(null);
        }

        return courseClassRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        CourseClass courseClass = findById(id);
        courseClass.setStatus(ClassStatus.CANCELLED);
        courseClassRepository.save(courseClass);
    }

    @Override
    @Transactional
    public CourseClass create(CourseClass courseClass, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }
        return create(courseClass);
    }

    @Override
    @Transactional
    public CourseClass update(Long id, CourseClass courseClass, User currentUser) {
        checkCanModify(id, currentUser);
        return update(id, courseClass);
    }

    @Override
    @Transactional
    public void delete(Long id, User currentUser) {
        checkCanModify(id, currentUser);
        delete(id);
    }

    private void checkCanModify(Long classId, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        CourseClass courseClass = findById(classId);
        if (courseClass.getTeacher() == null
                || courseClass.getTeacher().getId() == null
                || !courseClass.getTeacher().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
