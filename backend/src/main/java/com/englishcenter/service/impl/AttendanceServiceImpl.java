package com.englishcenter.service.impl;

import com.englishcenter.dto.request.AttendanceRecordRequest;
import com.englishcenter.dto.request.CreateAttendanceSheetRequest;
import com.englishcenter.dto.request.UpdateAttendanceSheetRequest;
import com.englishcenter.entity.AttendanceRecord;
import com.englishcenter.entity.AttendanceSheet;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.AttendanceSheetRepository;
import com.englishcenter.service.AttendanceService;
import com.englishcenter.service.CourseClassService;
import com.englishcenter.service.RegistrationService;
import com.englishcenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceSheetRepository attendanceSheetRepository;
    private final CourseClassService courseClassService;
    private final RegistrationService registrationService;
    private final UserService userService;

    @Override
    @Transactional
    public AttendanceSheet create(CreateAttendanceSheetRequest request, User currentUser) {
        CourseClass courseClass = courseClassService.findById(request.getClassId());
        requireClassTeacherOrAdmin(courseClass, currentUser);
        if (courseClass.getStatus() != ClassStatus.STUDYING) {
            throw new BusinessException("Attendance is only allowed when the class is STUDYING");
        }
        if (request.getDate().isAfter(LocalDate.now())) {
            throw new BusinessException("Attendance date must not be in the future");
        }
        if (attendanceSheetRepository.existsByCourseClass_IdAndDate(request.getClassId(), request.getDate())) {
            throw new BusinessException("Attendance sheet already exists for this class and date");
        }
        List<AttendanceRecord> records = buildRecords(request.getRecords(), request.getClassId());
        AttendanceSheet sheet = AttendanceSheet.builder()
                .courseClass(courseClass)
                .date(request.getDate())
                .createdBy(currentUser)
                .build();
        records.forEach(record -> record.setSheet(sheet));
        sheet.getRecords().addAll(records);
        return attendanceSheetRepository.save(sheet);
    }

    @Override
    @Transactional
    public AttendanceSheet update(Long id, UpdateAttendanceSheetRequest request, User currentUser) {
        AttendanceSheet sheet = getById(id);
        requireClassTeacherOrAdmin(sheet.getCourseClass(), currentUser);
        List<AttendanceRecord> records = buildRecords(request.getRecords(), sheet.getCourseClass().getId());
        sheet.getRecords().clear();
        records.forEach(record -> record.setSheet(sheet));
        sheet.getRecords().addAll(records);
        return attendanceSheetRepository.save(sheet);
    }

    @Override
    public AttendanceSheet findById(Long id, User currentUser) {
        AttendanceSheet sheet = getById(id);
        requireReadAccess(sheet, currentUser);
        return sheet;
    }

    @Override
    public List<AttendanceSheet> findAll(Long classId, LocalDate date, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            List<AttendanceSheet> sheets;
            if (classId != null) {
                sheets = attendanceSheetRepository.findByCourseClass_Id(classId);
            } else {
                sheets = attendanceSheetRepository.findAll();
            }
            return filterByDate(sheets, date);
        }
        if (currentUser.getRole() == Role.TEACHER) {
            if (classId != null) {
                CourseClass courseClass = courseClassService.findById(classId);
                if (courseClass.getTeacher() == null
                        || !courseClass.getTeacher().getId().equals(currentUser.getId())) {
                    throw new AccessDeniedException("Access denied");
                }
                return filterByDate(attendanceSheetRepository.findByCourseClass_Id(classId), date);
            }
            return filterByDate(attendanceSheetRepository.findByCourseClass_Teacher_Id(currentUser.getId()), date);
        }
        throw new AccessDeniedException("Access denied");
    }

    private List<AttendanceSheet> filterByDate(List<AttendanceSheet> sheets, LocalDate date) {
        if (date == null) {
            return sheets;
        }
        return sheets.stream().filter(s -> s.getDate().equals(date)).toList();
    }

    private List<AttendanceRecord> buildRecords(List<AttendanceRecordRequest> recordRequests, Long classId) {
        Set<Long> enrolledStudentIds = enrolledStudentIds(classId);
        Set<Long> seen = new HashSet<>();
        List<AttendanceRecord> records = new ArrayList<>();
        for (AttendanceRecordRequest recordRequest : recordRequests) {
            if (!enrolledStudentIds.contains(recordRequest.getStudentId())) {
                throw new BusinessException("Student is not enrolled in this class");
            }
            if (!seen.add(recordRequest.getStudentId())) {
                throw new BusinessException("Duplicate attendance record for student " + recordRequest.getStudentId());
            }
            User student = userService.findById(recordRequest.getStudentId());
            records.add(AttendanceRecord.builder()
                    .student(student)
                    .status(recordRequest.getStatus())
                    .build());
        }
        return records;
    }

    private Set<Long> enrolledStudentIds(Long classId) {
        return registrationService.findAllByClassId(classId).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.APPROVED || r.getStatus() == RegistrationStatus.PAID)
                .map(r -> r.getStudent().getId())
                .collect(Collectors.toSet());
    }

    private void requireClassTeacherOrAdmin(CourseClass courseClass, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        if (currentUser.getRole() == Role.TEACHER
                && courseClass.getTeacher() != null
                && courseClass.getTeacher().getId().equals(currentUser.getId())) {
            return;
        }
        throw new AccessDeniedException("Access denied");
    }

    private void requireReadAccess(AttendanceSheet sheet, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        if (currentUser.getRole() == Role.TEACHER
                && sheet.getCourseClass().getTeacher() != null
                && sheet.getCourseClass().getTeacher().getId().equals(currentUser.getId())) {
            return;
        }
        throw new AccessDeniedException("Access denied");
    }

    private AttendanceSheet getById(Long id) {
        return attendanceSheetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSheet", id));
    }
}
