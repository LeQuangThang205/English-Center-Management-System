package com.englishcenter.service;

import com.englishcenter.entity.Transaction;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.TransactionStatus;

import java.util.List;

public interface TransactionService {

    Transaction create(Long registrationId, User currentUser);

    Transaction findById(Long id, User currentUser);

    List<Transaction> findAll(TransactionStatus status, Long studentId, Long registrationId, User currentUser);

    Transaction reportPaid(Long id, User currentUser);

    Transaction confirm(Long id, User currentUser);

    Transaction reject(Long id, User currentUser);
}
