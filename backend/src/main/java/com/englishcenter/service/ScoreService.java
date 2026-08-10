package com.englishcenter.service;

import com.englishcenter.dto.request.CreateScoreRequest;
import com.englishcenter.dto.request.UpdateScoreRequest;
import com.englishcenter.entity.Score;
import com.englishcenter.entity.User;

import java.util.List;

public interface ScoreService {

    Score create(CreateScoreRequest request, User currentUser);

    Score findById(Long id, User currentUser);

    List<Score> findAll(Long studentId, Long classId, User currentUser);

    Score update(Long id, UpdateScoreRequest request, User currentUser);

    void delete(Long id, User currentUser);
}
