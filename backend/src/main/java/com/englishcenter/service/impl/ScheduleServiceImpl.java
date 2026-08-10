package com.englishcenter.service.impl;

import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Registration;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.repository.CourseClassRepository;
import com.englishcenter.service.RegistrationService;
import com.englishcenter.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {

    private final CourseClassRepository courseClassRepository;
    private final RegistrationService registrationService;

    @Override
    public List<CourseClass> getSchedule(User currentUser, LocalDate from, LocalDate to) {
        List<CourseClass> classes;
        if (currentUser.getRole() == Role.ADMIN) {
            classes = courseClassRepository.findByStatus(ClassStatus.STUDYING);
        } else if (currentUser.getRole() == Role.TEACHER) {
            classes = courseClassRepository.findByTeacher_Id(currentUser.getId()).stream()
                    .filter(c -> c.getStatus() == ClassStatus.STUDYING)
                    .toList();
        } else if (currentUser.getRole() == Role.STUDENT) {
            classes = registrationService.findAllByStudentId(currentUser.getId()).stream()
                    .filter(r -> r.getStatus() == RegistrationStatus.APPROVED || r.getStatus() == RegistrationStatus.PAID)
                    .map(Registration::getCourseClass)
                    .filter(c -> c.getStatus() == ClassStatus.STUDYING)
                    .distinct()
                    .toList();
        } else {
            return List.of();
        }
        return filterByDateRange(classes, from, to);
    }

    private List<CourseClass> filterByDateRange(List<CourseClass> classes, LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return classes;
        }
        LocalDate effectiveFrom = from != null ? from : LocalDate.MIN;
        LocalDate effectiveTo = to != null ? to : LocalDate.MAX;
        return classes.stream()
                .filter(c -> !c.getEndDate().isBefore(effectiveFrom) && !c.getStartDate().isAfter(effectiveTo))
                .toList();
    }
}
