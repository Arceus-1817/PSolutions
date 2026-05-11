package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.dto.CreateUserRequest;
import com.pigmypay.PSolutions.model.Branch;
import com.pigmypay.PSolutions.model.Role;
import com.pigmypay.PSolutions.model.Tenant;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.BranchRepository;
import com.pigmypay.PSolutions.repository.TenantRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    // Helper: extracts the raw token string from the "Bearer xyz" header
    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new RuntimeException("Missing or invalid Authorization header");
    }

    // ── GET all users for a tenant (STRICT HIERARCHY) ──────────────────────
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<?> getUsersForDashboard(
            @PathVariable Long tenantId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            String userEmail = jwtService.extractUsername(token);
            User requestingUser = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // SECURITY WALL: Prevent cross-tenant access
            if (!requestingUser.getTenant().getId().equals(tenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: You cannot view agents from a different tenant.");
            }

            Role role = requestingUser.getRole();

            // LEVEL 1: COMPANY ADMIN (Sees all branches, but NOT System Admin)
            if (role == Role.ADMIN) {
                return ResponseEntity.ok(userRepository.findByTenantIdAndRoleNot(tenantId, Role.SYSTEM_ADMIN));
            }
            // LEVEL 2: BRANCH MANAGER (Sees ONLY their branch)
            else if (role == Role.MANAGER) {
                Long branchId = requestingUser.getBranch().getId();
                return ResponseEntity.ok(userRepository.findByBranchIdAndRoleNot(branchId, Role.SYSTEM_ADMIN));
            }
            // LEVEL 3: AGENTS (Should not see the user list at all)
            else {
                return ResponseEntity.status(403).body("Access Denied: Agents cannot view company directory.");
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ── POST create a new user ─────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createUser(
            @RequestBody CreateUserRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);

            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body("Email already exists");
            }

            // SECURE: Ignore request.getTenantId(). Map to the token's tenant.
            Tenant tenant = tenantRepository.findById(tokenTenantId)
                    .orElseThrow(() -> new RuntimeException("Tenant not found"));

            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "");
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(Role.valueOf(request.getRole()));
            user.setTenant(tenant);

            if (request.getBranchId() != null) {
                Branch branch = branchRepository.findById(request.getBranchId())
                        .orElseThrow(() -> new RuntimeException("Branch not found"));
                user.setBranch(branch);
            }

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── PUT update user role and/or branch ────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // SECURE: Prevent updating a user that belongs to a different company
            if (!user.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: User belongs to a different tenant.");
            }

            if (updates.containsKey("role")) {
                user.setRole(Role.valueOf((String) updates.get("role")));
            }
            if (updates.containsKey("name")) {
                user.setName((String) updates.get("name"));
            }
            if (updates.containsKey("phoneNumber")) {
                user.setPhoneNumber((String) updates.get("phoneNumber"));
            }
            if (updates.containsKey("branchId")) {
                Object branchIdRaw = updates.get("branchId");
                if (branchIdRaw == null) {
                    user.setBranch(null);
                } else {
                    Long branchId = Long.valueOf(branchIdRaw.toString());
                    Branch branch = branchRepository.findById(branchId)
                            .orElseThrow(() -> new RuntimeException("Branch not found"));
                    user.setBranch(branch);
                }
            }

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── PATCH reset password ───────────────────────────────────────────────
    @PatchMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);

            String newPassword = body.get("password");
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body("Password must be at least 6 characters");
            }

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // SECURE: Prevent resetting password for a user in a different company
            if (!user.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: User belongs to a different tenant.");
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── DELETE user ────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // SECURE: Prevent deleting a user in a different company
            if (!user.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: User belongs to a different tenant.");
            }

            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete: " + e.getMessage());
        }
    }
}