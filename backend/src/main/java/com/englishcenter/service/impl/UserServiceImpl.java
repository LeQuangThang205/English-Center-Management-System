package com.englishcenter.service.impl;

import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;
import com.englishcenter.exception.DuplicateResourceException;
import com.englishcenter.exception.ResourceNotFoundException;
import com.englishcenter.repository.UserRepository;
import com.englishcenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public User create(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new DuplicateResourceException("User", "email", user.getEmail());
        }
        return userRepository.save(user);
    }

    @Override
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public List<User> findAllByStatus(UserStatus status) {
        return userRepository.findByStatus(status);
    }

    @Override
    public List<User> findAllByRole(Role role) {
        return userRepository.findByRole(role);
    }

    @Override
    @Transactional
    public User update(Long id, User user) {
        User existing = findById(id);
        if (!existing.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(user.getEmail())) {
            throw new DuplicateResourceException("User", "email", user.getEmail());
        }
        existing.setEmail(user.getEmail());
        existing.setFullName(user.getFullName());
        existing.setPhone(user.getPhone());
        existing.setRole(user.getRole());
        existing.setStatus(user.getStatus());
        existing.setAvatarUrl(user.getAvatarUrl());
        if (user.getPasswordHash() != null) {
            existing.setPasswordHash(user.getPasswordHash());
        }
        return userRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        User user = findById(id);
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);
    }

    @Override
    public List<User> findAll(UserStatus status, Role role, User currentUser) {
        if (!isAdmin(currentUser)) {
            return List.of(findById(currentUser.getId()));
        }
        if (status != null) {
            return userRepository.findByStatus(status);
        }
        if (role != null) {
            return userRepository.findByRole(role);
        }
        return userRepository.findAll();
    }

    @Override
    public User findById(Long id, User currentUser) {
        checkSelfOrAdmin(currentUser, id);
        return findById(id);
    }

    @Override
    public User findByEmail(String email, User currentUser) {
        User user = findByEmail(email);
        checkSelfOrAdmin(currentUser, user.getId());
        return user;
    }

    @Override
    @Transactional
    public User create(User user, User currentUser) {
        if (!isAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }
        return create(user);
    }

    @Override
    @Transactional
    public User update(Long id, User user, User currentUser) {
        checkSelfOrAdmin(currentUser, id);
        return update(id, user);
    }

    @Override
    @Transactional
    public void delete(Long id, User currentUser) {
        if (!isAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }
        delete(id);
    }

    private boolean isAdmin(User currentUser) {
        return currentUser.getRole() == Role.ADMIN;
    }

    private void checkSelfOrAdmin(User currentUser, Long targetId) {
        if (!isAdmin(currentUser) && !currentUser.getId().equals(targetId)) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
