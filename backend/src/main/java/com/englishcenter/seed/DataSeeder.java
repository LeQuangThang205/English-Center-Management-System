package com.englishcenter.seed;

import com.englishcenter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("seed")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final String SEED_ADMIN_EMAIL = "admin@example.com";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (isAlreadySeeded()) {
            log.info("Seed data already present; skipping seed generation");
            return;
        }
        log.info("Starting seed data generation");
        log.info("Finished seed data generation");
    }

    private boolean isAlreadySeeded() {
        return userRepository.existsByEmail(SEED_ADMIN_EMAIL);
    }
}