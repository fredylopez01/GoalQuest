package com.goalquest.identity.config;

import com.goalquest.identity.entity.User;
import com.goalquest.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:admin@goalquest.com}")
    private String adminEmail;

    @Value("${admin.password:Admin1234!}")
    private String adminPassword;

    @Value("${admin.name:Admin GoalQuest}")
    private String adminName;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Usuario admin ya existe — omitiendo creación: {}", adminEmail);
            return;
        }

        User admin = User.builder()
                .name(adminName)
                .email(adminEmail)
                .hashPassword(passwordEncoder.encode(adminPassword))
                .rol("ADMIN")
                .build();

        userRepository.save(admin);
        log.info("===================================================");
        log.info("  Usuario admin creado exitosamente");
        log.info("  Email:    {}", adminEmail);
        log.info("  Password: {}", adminPassword);
        log.info("===================================================");
    }
}
