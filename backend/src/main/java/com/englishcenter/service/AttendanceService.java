package com.englishcenter.service;

import com.englishcenter.dto.request.CreateAttendanceSheetRequest;
import com.englishcenter.dto.request.UpdateAttendanceSheetRequest;
import com.englishcenter.entity.AttendanceSheet;
import com.englishcenter.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {

    AttendanceSheet create(CreateAttendanceSheetRequest request, User currentUser);

    AttendanceSheet findById(Long id, User currentUser);

    List<AttendanceSheet> findAll(Long classId, LocalDate date, User currentUser);

    AttendanceSheet update(Long id, UpdateAttendanceSheetRequest request, User currentUser);
}
