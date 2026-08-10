package com.englishcenter.repository;

import com.englishcenter.entity.Transaction;
import com.englishcenter.entity.enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByRegistration_Id(Long registrationId);

    List<Transaction> findByRegistration_Student_Id(Long studentId);

    List<Transaction> findByStatus(TransactionStatus status);

    boolean existsByRegistration_IdAndStatus(Long registrationId, TransactionStatus status);
}
