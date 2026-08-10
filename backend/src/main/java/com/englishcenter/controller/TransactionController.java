package com.englishcenter.controller;

import com.englishcenter.dto.request.CreateTransactionRequest;
import com.englishcenter.dto.response.ApiResponse;
import com.englishcenter.dto.response.TransactionResponse;
import com.englishcenter.entity.Transaction;
import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.TransactionStatus;
import com.englishcenter.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
            @AuthenticationPrincipal User currentUser,
            @RequestBody CreateTransactionRequest request) {
        Transaction created = transactionService.create(request.getRegistrationId(), currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(TransactionResponse.fromEntity(created), "Transaction created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> findAll(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long registrationId) {
        List<Transaction> transactions = transactionService.findAll(status, studentId, registrationId, currentUser);
        List<TransactionResponse> response = transactions.stream().map(TransactionResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> findById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        Transaction transaction = transactionService.findById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(TransactionResponse.fromEntity(transaction)));
    }

    @PutMapping("/{id}/report-paid")
    public ResponseEntity<ApiResponse<TransactionResponse>> reportPaid(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        Transaction transaction = transactionService.reportPaid(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(TransactionResponse.fromEntity(transaction), "Payment reported successfully"));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<TransactionResponse>> confirm(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        Transaction transaction = transactionService.confirm(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(TransactionResponse.fromEntity(transaction), "Transaction confirmed successfully"));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<TransactionResponse>> reject(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        Transaction transaction = transactionService.reject(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(TransactionResponse.fromEntity(transaction), "Transaction rejected successfully"));
    }
}
