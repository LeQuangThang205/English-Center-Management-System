package com.englishcenter.service;

import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleService {

    List<CourseClass> getSchedule(User currentUser, LocalDate from, LocalDate to);
}
