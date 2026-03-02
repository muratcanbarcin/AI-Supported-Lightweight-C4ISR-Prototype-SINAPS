package com.sinaps.c4isr_backend.config;

import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.model.User;
import com.sinaps.c4isr_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password("admin123") // Default password for prototype
                    .fullName("System Administrator")
                    .rank("GENERAL")
                    .role(Role.ROLE_ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            System.out.println("CREATED DEFAULT ADMIN USER: admin / admin123");
        }
    }
}
