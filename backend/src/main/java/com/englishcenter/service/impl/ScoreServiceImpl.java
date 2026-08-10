package com.englishcenter.service.impl;

import com.englishcenter.dto.request.CreateScoreRequest;
import com.englishcenter.dto.request.UpdateScoreRequest;
import com.englishcenter.entity.CourseClass;
import com.englishcenter.entity.Score;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.ClassStatus;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.ScoreRepository;
import com.englishcenter.service.CourseClassService;
import com.englishcenter.service.RegistrationService;
import com.englishcenter.service.ScoreService;
import com.englishcenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoreServiceImpl implements ScoreService {

    private static final BigDecimal MIDTERM_WEIGHT = new BigDecimal("0.4");
    private static final BigDecimal FINAL_WEIGHT = new BigDecimal("0.6");

    private final ScoreRepository scoreRepository;
    private final UserService userService;
    private final CourseClassService courseClassService;
    private final RegistrationService registrationService;

    @Override
    @Transactional
    public Score create(CreateScoreRequest request, User currentUser) {
        User student = userService.findById(request.getStudentId());
        if (student.getRole() != Role.STUDENT) {
            throw new BusinessException("Only users with role STUDENT can have a score");
        }
        CourseClass courseClass = courseClassService.findById(request.getClassId());
        requireClassTeacherOrAdmin(courseClass, currentUser);
        requireClassOpenForScoring(courseClass);
        requireEnrolledStudent(courseClass.getId(), request.getStudentId());

        return scoreRepository.findByStudent_IdAndCourseClass_Id(request.getStudentId(), request.getClassId())
                .map(existing -> {
                    applyScores(existing, request.getMidtermScore(), request.getFinalScore(), request.getComment());
                    return scoreRepository.save(existing);
                })
                .orElseGet(() -> {
                    Score score = Score.builder()
                            .student(student)
                            .courseClass(courseClass)
                            .createdBy(currentUser)
                            .build();
                    applyScores(score, request.getMidtermScore(), request.getFinalScore(), request.getComment());
                    return scoreRepository.save(score);
                });
    }

    @Override
    public Score findById(Long id, User currentUser) {
        Score score = getById(id);
        requireReadAccess(score, currentUser);
        return score;
    }

    @Override
    public List<Score> findAll(Long studentId, Long classId, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            if (studentId != null) {
                return scoreRepository.findByStudent_Id(studentId);
            }
            if (classId != null) {
                return scoreRepository.findByCourseClass_Id(classId);
            }
            return scoreRepository.findAll();
        }
        if (currentUser.getRole() == Role.TEACHER) {
            if (classId != null) {
                CourseClass courseClass = courseClassService.findById(classId);
                requireClassTeacherOrAdmin(courseClass, currentUser);
                return scoreRepository.findByCourseClass_Id(classId);
            }
            return scoreRepository.findByCourseClass_Teacher_Id(currentUser.getId());
        }
        if (currentUser.getRole() == Role.STUDENT) {
            if (studentId != null && !studentId.equals(currentUser.getId())) {
                throw new AccessDeniedException("Access denied");
            }
            return scoreRepository.findByStudent_Id(currentUser.getId());
        }
        throw new AccessDeniedException("Access denied");
    }

    @Override
    @Transactional
    public Score update(Long id, UpdateScoreRequest request, User currentUser) {
        Score score = getById(id);
        requireClassTeacherOrAdmin(score.getCourseClass(), currentUser);
        requireClassOpenForScoring(score.getCourseClass());
        applyScores(score, request.getMidtermScore(), request.getFinalScore(), request.getComment());
        return scoreRepository.save(score);
    }

    @Override
    @Transactional
    public void delete(Long id, User currentUser) {
        Score score = getById(id);
        requireClassTeacherOrAdmin(score.getCourseClass(), currentUser);
        scoreRepository.delete(score);
    }

    private void applyScores(Score score, BigDecimal midterm, BigDecimal fin, String comment) {
        score.setMidtermScore(midterm);
        score.setFinalScore(fin);
        score.setTotalScore(calculateTotal(midterm, fin));
        score.setComment(comment);
    }

    private BigDecimal calculateTotal(BigDecimal midterm, BigDecimal fin) {
        if (midterm == null || fin == null) {
            return null;
        }
        return midterm.multiply(MIDTERM_WEIGHT)
                .add(fin.multiply(FINAL_WEIGHT))
                .setScale(1, RoundingMode.HALF_UP);
    }

    private void requireEnrolledStudent(Long classId, Long studentId) {
        boolean enrolled = registrationService.findAllByClassId(classId).stream()
                .anyMatch(r -> r.getStudent().getId().equals(studentId)
                        && (r.getStatus() == RegistrationStatus.APPROVED || r.getStatus() == RegistrationStatus.PAID));
        if (!enrolled) {
            throw new BusinessException("Student is not enrolled in this class");
        }
    }

    private void requireClassOpenForScoring(CourseClass courseClass) {
        if (courseClass.getStatus() != ClassStatus.STUDYING && courseClass.getStatus() != ClassStatus.FINISHED) {
            throw new BusinessException("Scores can only be entered when the class is STUDYING or FINISHED");
        }
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

    private void requireReadAccess(Score score, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        if (currentUser.getRole() == Role.TEACHER
                && score.getCourseClass().getTeacher() != null
                && score.getCourseClass().getTeacher().getId().equals(currentUser.getId())) {
            return;
        }
        if (currentUser.getRole() == Role.STUDENT
                && score.getStudent().getId().equals(currentUser.getId())) {
            return;
        }
        throw new AccessDeniedException("Access denied");
    }

    private Score getById(Long id) {
        return scoreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Score", id));
    }
}
