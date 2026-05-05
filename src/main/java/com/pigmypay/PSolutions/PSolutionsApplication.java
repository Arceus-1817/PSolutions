package com.pigmypay.PSolutions;

import com.pigmypay.PSolutions.model.Role;
import com.pigmypay.PSolutions.model.Tenant;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.TenantRepository;
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
	CommandLineRunner initDatabase(UserRepository userRepository,
								   TenantRepository tenantRepository,
								   PasswordEncoder passwordEncoder) {
		return args -> {
			// Create default tenant first
			Tenant defaultTenant;
			var existingTenant = tenantRepository.findAll();
			if (existingTenant.isEmpty()) {
				defaultTenant = new Tenant();
				defaultTenant.setCompanyName("PigmyPay HQ");
				defaultTenant.setPlan("ENTERPRISE");
				defaultTenant = tenantRepository.save(defaultTenant);
				System.out.println("✅ DEFAULT TENANT CREATED");
			} else {
				defaultTenant = existingTenant.get(0);
			}

			// Create admin if not exists
			if (userRepository.findByEmail("admin@pigmypay.com").isEmpty()) {
				User admin = new User();
				admin.setName("Regional Manager");
				admin.setEmail("admin@pigmypay.com");
				admin.setPassword(passwordEncoder.encode("admin123"));
				admin.setRole(Role.ADMIN);
				admin.setPhoneNumber("0000000000");
				admin.setTenant(defaultTenant);
				userRepository.save(admin);
				System.out.println("✅ DEFAULT ADMIN CREATED");
			}
		};
	}
}