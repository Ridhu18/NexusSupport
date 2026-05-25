package com.ticket.system.config;

import com.ticket.system.model.Role;
import com.ticket.system.model.User;
import com.ticket.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("💾 Database is empty. Seeding initial role-based users...");

            // Seed Admin
            User admin = User.builder()
                    .username("admin")
                    .email("admin@support.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);

            // Seed Support Agent
            User agent = User.builder()
                    .username("agent")
                    .email("agent@support.com")
                    .passwordHash(passwordEncoder.encode("agent123"))
                    .role(Role.SUPPORT_AGENT)
                    .build();
            userRepository.save(agent);

            // Seed Standard User
            User user = User.builder()
                    .username("user")
                    .email("user@support.com")
                    .passwordHash(passwordEncoder.encode("user123"))
                    .role(Role.USER)
                    .build();
            userRepository.save(user);

            log.info("✅ Database seeded successfully!");
            log.info("🔑 Test accounts initialized:");
            log.info("   -> [Admin]         Username: admin  / Password: admin123");
            log.info("   -> [Support Agent] Username: agent  / Password: agent123");
            log.info("   -> [Regular User]  Username: user   / Password: user123");
        } else {
            log.info("💾 Database already contains records. Ensuring test accounts use user's real email with sub-addressing...");
            userRepository.findByUsername("user").ifPresent(u -> {
                u.setEmail("ridhamp2005+user@gmail.com");
                userRepository.save(u);
            });
            userRepository.findByUsername("agent").ifPresent(u -> {
                u.setEmail("ridhamp2005+agent@gmail.com");
                userRepository.save(u);
            });
            userRepository.findByUsername("admin").ifPresent(u -> {
                u.setEmail("ridhamp2005+admin@gmail.com");
                userRepository.save(u);
            });
        }
    }
}
