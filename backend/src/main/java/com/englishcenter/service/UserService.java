package com.englishcenter.service;

import com.englishcenter.entity.User;
import com.englishcenter.entity.enums.Role;
import com.englishcenter.entity.enums.UserStatus;

import java.util.List;

public interface UserService {

    User create(User user);

    User findById(Long id);

    User findByEmail(String email);

    List<User> findAll();

    List<User> findAllByStatus(UserStatus status);

    List<User> findAllByRole(Role role);

    User update(Long id, User user);

    void delete(Long id);

    List<User> findAll(UserStatus status, Role role, User currentUser);

    User findById(Long id, User currentUser);

    User findByEmail(String email, User currentUser);

    User create(User user, User currentUser);

    User update(Long id, User user, User currentUser);

    void delete(Long id, User currentUser);
}
