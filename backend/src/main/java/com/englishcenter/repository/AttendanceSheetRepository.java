package com.englishcenter.repository;

import com.englishcenter.entity.AttendanceSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceSheetRepository extends JpaRepository<AttendanceSheet, Long> {

    boolean existsByCourseClass_IdAndDate(Long classId, LocalDate date);

    List<AttendanceSheet> findByCourseClass_Id(Long classId);

    List<AttendanceSheet> findByCourseClass_Teacher_Id(Long teacherId);
}
