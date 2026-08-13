package com.englishcenter.repository;

import com.englishcenter.entity.NotificationRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Long> {

    List<NotificationRecipient> findByUser_IdOrderByNotification_CreatedAtDesc(Long userId);

    List<NotificationRecipient> findByUser_IdAndIsReadFalse(Long userId);

    long countByUser_IdAndIsReadFalse(Long userId);

    Optional<NotificationRecipient> findByNotification_IdAndUser_Id(Long notificationId, Long userId);

    List<NotificationRecipient> findByNotification_Id(Long notificationId);

    void deleteByNotification_IdAndUser_Id(Long notificationId, Long userId);
}