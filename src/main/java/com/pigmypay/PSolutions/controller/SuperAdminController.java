package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Role;
import com.pigmypay.PSolutions.model.Tenant;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.TenantRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/superadmin")
public class SuperAdminController {

    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ── 1. GET ALL CLIENTS (Tenants) ──
    @GetMapping("/clients")
    public ResponseEntity<?> getAllClients() {
        // In a real app, verify the JWT belongs to a SYSTEM_ADMIN here
        return ResponseEntity.ok(tenantRepository.findAll());
    }

    // ── 2. ONBOARD NEW CLIENT ──
    // ── 2. ONBOARD NEW CLIENT ──
    @PostMapping("/onboard")
    @org.springframework.transaction.annotation.Transactional // <-- PREVENTS GHOST COMPANIES
    public ResponseEntity<?> onboardNewClient(@RequestBody OnboardRequest request) {
        try {
            // Step 1: Create the new Company (Tenant)
            Tenant newCompany = new Tenant();
            newCompany.setCompanyName(request.getCompanyName());
            newCompany.setPlan(request.getPlan());
            newCompany.setStatus("ACTIVE");
            newCompany.setCreatedAt(LocalDateTime.now());
            Tenant savedCompany = tenantRepository.save(newCompany);

            // Step 2: Create their primary Admin User
            if (userRepository.findByEmail(request.getAdminEmail()).isPresent()) {
                throw new RuntimeException("Email already exists in the system.");
                // We use throw here so @Transactional catches it and rolls back the Tenant!
            }

            User firstAdmin = new User();
            firstAdmin.setName(request.getAdminName());
            firstAdmin.setEmail(request.getAdminEmail());
            firstAdmin.setPassword(passwordEncoder.encode(request.getAdminPassword()));
            firstAdmin.setPhoneNumber(request.getAdminPhoneNumber()); // <-- FIXED: Added Phone Number
            firstAdmin.setRole(Role.ADMIN);
            firstAdmin.setTenant(savedCompany);
            userRepository.save(firstAdmin);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Client successfully onboarded!");
            response.put("tenantId", savedCompany.getId());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // If anything fails, @Transactional undoes the database changes automatically
            return ResponseEntity.badRequest().body("Onboarding failed: " + e.getMessage());
        }
    }

    // UPDATED DTO
    public static class OnboardRequest {
        private String companyName;
        private String plan;
        private String adminName;
        private String adminEmail;
        private String adminPassword;
        private String adminPhoneNumber; // <-- NEW

        public String getCompanyName() { return companyName; }
        public String getPlan() { return plan; }
        public String getAdminName() { return adminName; }
        public String getAdminEmail() { return adminEmail; }
        public String getAdminPassword() { return adminPassword; }
        public String getAdminPhoneNumber() { return adminPhoneNumber; } // <-- NEW
    }
}