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
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableScheduling
public class PSolutionsApplication {

	public static void main(String[] args) {
		SpringApplication.run(PSolutionsApplication.class, args);
	}

	// ─── THE BOOTSTRAPPER ───────────────────────────────────────────
	// Runs once on startup. Automatically rebuilds the System Admin
	// if the database is ever wiped.
	@Bean
	CommandLineRunner initDatabase(UserRepository userRepository,
								   TenantRepository tenantRepository,
								   PasswordEncoder passwordEncoder) {
		return args -> {

			// 1. Create the Master Tenant (HQ) if it doesn't exist
			Tenant hqTenant;
			var existingTenant = tenantRepository.findAll();
			if (existingTenant.isEmpty()) {
				hqTenant = new Tenant();
				hqTenant.setCompanyName("PigmyPay System HQ");
				hqTenant.setPlan("ENTERPRISE");
				hqTenant = tenantRepository.save(hqTenant);
				System.out.println("✅ MASTER TENANT CREATED");
			} else {
				hqTenant = existingTenant.get(0);
			}

			// 2. Create the SYSTEM_ADMIN (God Mode) if it doesn't exist
			if (userRepository.findByEmail("patil.shreyansh.18@gmail.com").isEmpty()) {
				User superAdmin = new User();
				superAdmin.setName("System Owner");
				superAdmin.setEmail("patil.shreyansh.18@gmail.com"); // Distinct email
				superAdmin.setPassword(passwordEncoder.encode("Snp@1817")); // Default password
				superAdmin.setRole(Role.SYSTEM_ADMIN); // <-- 4-Tier God Mode Role
				superAdmin.setPhoneNumber("9999999999");
				superAdmin.setTenant(hqTenant);
				userRepository.save(superAdmin);
				System.out.println("✅ SYSTEM ADMIN CREATED (Login: patil.shreyansh.18@gmail.com / Snp@1817)");
			}
		};
	}
}