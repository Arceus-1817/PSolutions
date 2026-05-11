package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Route;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.model.Role;
import com.pigmypay.PSolutions.repository.RouteRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired private RouteRepository routeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtService jwtService;

    private String extractToken(String authHeader) {
        return authHeader.substring(7);
    }

    // 1. GET ROUTES (Securely filtered by Branch/Tenant)
    @GetMapping
    public ResponseEntity<?> getRoutes(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = userRepository.findByEmail(jwtService.extractUsername(extractToken(authHeader)))
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getRole() == Role.MANAGER) {
                // Managers only see routes for their specific branch
                return ResponseEntity.ok(routeRepository.findByBranchId(user.getBranch().getId()));
            } else {
                // Admins see all routes in the company
                return ResponseEntity.ok(routeRepository.findByTenantId(user.getTenant().getId()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 2. CREATE NEW ROUTE
    @PostMapping
    public ResponseEntity<?> createRoute(
            @RequestBody Route route,
            @RequestHeader("Authorization") String authHeader) {
        try {
            User user = userRepository.findByEmail(jwtService.extractUsername(extractToken(authHeader)))
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Auto-assign the Route to the creator's Company & Branch
            route.setTenant(user.getTenant());
            if (user.getRole() == Role.MANAGER) {
                route.setBranch(user.getBranch());
            }

            return ResponseEntity.ok(routeRepository.save(route));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving route: " + e.getMessage());
        }
    }
}