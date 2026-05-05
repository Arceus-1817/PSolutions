package com.pigmypay.PSolutions;

import com.pigmypay.PSolutions.model.Role;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class PSolutionsApplication {

	public static void main(String[] args) {
		SpringApplication.run(PSolutionsApplication.class, args);
	}

	// NEW: The Bootstrapper!
	// This runs once when you click "Play". It checks if the admin exists, and if not, creates them.
	@Bean
	CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			if (userRepository.findByEmail("admin@pigmypay.com").isEmpty()) {
				User admin = new User();
				admin.setName("Regional Manager");
				admin.setEmail("admin@pigmypay.com");
				admin.setPassword(passwordEncoder.encode("admin123"));
				admin.setRole(Role.ADMIN);

				// NEW: Give the admin a phone number so the database accepts it!
				admin.setPhoneNumber("0000000000");

				userRepository.save(admin);
				System.out.println("✅ DEFAULT ADMIN ACCOUNT CREATED!");
			}
		};
	}
}