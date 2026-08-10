package com.englishcenter.dto.response;

import com.englishcenter.entity.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
public class TransactionResponse {
    private Long id;
    private Long registrationId;
    private Long studentId;
    private String studentName;
    private Long classId;
    private String className;
    private String courseName;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionCode;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private LocalDateTime confirmedAt;
    private Long confirmedById;
    private String confirmedByName;
    private LocalDateTime updatedAt;

    public static TransactionResponse fromEntity(Transaction transaction) {
        TransactionResponseBuilder builder = TransactionResponse.builder()
                .id(transaction.getId())
                .registrationId(transaction.getRegistration().getId())
                .studentId(transaction.getRegistration().getStudent().getId())
                .studentName(transaction.getRegistration().getStudent().getFullName())
                .classId(transaction.getRegistration().getCourseClass().getId())
                .className(transaction.getRegistration().getCourseClass().getName())
                .courseName(transaction.getRegistration().getCourseClass().getCourse().getName())
                .amount(transaction.getAmount())
                .paymentMethod(transaction.getPaymentMethod().name())
                .transactionCode(transaction.getTransactionCode())
                .status(transaction.getStatus().name())
                .createdAt(transaction.getCreatedAt())
                .paidAt(transaction.getPaidAt())
                .confirmedAt(transaction.getConfirmedAt())
                .updatedAt(transaction.getUpdatedAt());
        if (transaction.getConfirmedBy() != null) {
            builder.confirmedById(transaction.getConfirmedBy().getId());
            builder.confirmedByName(transaction.getConfirmedBy().getFullName());
        }
        return builder.build();
    }
}
