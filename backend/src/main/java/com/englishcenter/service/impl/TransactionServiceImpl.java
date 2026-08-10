package com.englishcenter.service.impl;

import com.englishcenter.entity.Registration;
import com.englishcenter.entity.Transaction;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.PaymentMethod;
import com.englishcenter.entity.enums.RegistrationStatus;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.TransactionStatus;
import com.englishcenter.exception.BusinessException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.TransactionRepository;
import com.englishcenter.service.RegistrationService;
import com.englishcenter.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final RegistrationService registrationService;

    @Override
    @Transactional
    public Transaction create(Long registrationId, User currentUser) {
        if (currentUser.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Access denied");
        }
        Registration registration = registrationService.findById(registrationId);
        if (!registration.getStudent().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }
        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            throw new BusinessException("Only APPROVED registrations can be paid");
        }
        if (transactionRepository.existsByRegistration_IdAndStatus(registrationId, TransactionStatus.SUCCESS)) {
            throw new BusinessException("Registration has already been paid");
        }
        Transaction transaction = Transaction.builder()
                .registration(registration)
                .amount(registration.getTuitionAtRegistration())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .transactionCode(generateTransactionCode(registrationId))
                .status(TransactionStatus.PENDING_CONFIRMATION)
                .build();
        return transactionRepository.save(transaction);
    }

    @Override
    public Transaction findById(Long id, User currentUser) {
        Transaction transaction = getById(id);
        if (currentUser.getRole() != Role.ADMIN
                && !transaction.getRegistration().getStudent().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }
        return transaction;
    }

    @Override
    public List<Transaction> findAll(TransactionStatus status, Long studentId, Long registrationId, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            if (studentId != null) {
                return transactionRepository.findByRegistration_Student_Id(studentId);
            }
            if (registrationId != null) {
                return transactionRepository.findByRegistration_Id(registrationId);
            }
            if (status != null) {
                return transactionRepository.findByStatus(status);
            }
            return transactionRepository.findAll();
        }
        if (currentUser.getRole() == Role.STUDENT) {
            if (studentId != null && !studentId.equals(currentUser.getId())) {
                throw new AccessDeniedException("Access denied");
            }
            List<Transaction> result = new ArrayList<>(
                    transactionRepository.findByRegistration_Student_Id(currentUser.getId()));
            if (registrationId != null) {
                result.removeIf(t -> !t.getRegistration().getId().equals(registrationId));
            }
            if (status != null) {
                result.removeIf(t -> t.getStatus() != status);
            }
            return result;
        }
        throw new AccessDeniedException("Access denied");
    }

    @Override
    @Transactional
    public Transaction reportPaid(Long id, User currentUser) {
        if (currentUser.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Access denied");
        }
        Transaction transaction = getById(id);
        if (!transaction.getRegistration().getStudent().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied");
        }
        if (transaction.getStatus() != TransactionStatus.PENDING_CONFIRMATION) {
            throw new BusinessException("Only PENDING_CONFIRMATION transactions can be marked as paid");
        }
        transaction.setPaidAt(LocalDateTime.now());
        return transactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public Transaction confirm(Long id, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }
        Transaction transaction = getById(id);
        if (transaction.getStatus() != TransactionStatus.PENDING_CONFIRMATION) {
            throw new BusinessException("Only PENDING_CONFIRMATION transactions can be confirmed");
        }
        Registration registration = transaction.getRegistration();
        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            throw new BusinessException("Registration is not APPROVED");
        }
        if (transactionRepository.existsByRegistration_IdAndStatus(registration.getId(), TransactionStatus.SUCCESS)) {
            throw new BusinessException("Registration has already been paid");
        }
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setConfirmedAt(LocalDateTime.now());
        transaction.setConfirmedBy(currentUser);
        registrationService.markPaid(registration.getId(), currentUser);
        return transactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public Transaction reject(Long id, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }
        Transaction transaction = getById(id);
        if (transaction.getStatus() != TransactionStatus.PENDING_CONFIRMATION) {
            throw new BusinessException("Only PENDING_CONFIRMATION transactions can be rejected");
        }
        transaction.setStatus(TransactionStatus.FAILED);
        return transactionRepository.save(transaction);
    }

    private Transaction getById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
    }

    private String generateTransactionCode(Long registrationId) {
        return "TXN" + System.currentTimeMillis() + registrationId;
    }
}
