package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import com.pigmypay.PSolutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JwtService jwtService;

    // Helper: extracts the raw token string from the "Bearer xyz" header
    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new RuntimeException("Missing or invalid Authorization header");
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getCustomersForAgent(
            @PathVariable Long agentId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tenantId = jwtService.extractTenantId(token); // reads from JWT claims

            List<Customer> customers = customerRepository
                    .findByAssignedAgentIdAndTenantId(agentId, tenantId);

            if (customers.isEmpty()) {
                return ResponseEntity.ok(List.of()); // return empty array, not a string
            }
            return ResponseEntity.ok(customers);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching customers: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> addNewCustomer(
            @RequestBody Customer newCustomer,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tenantId = jwtService.extractTenantId(token);

            // Enforce tenant isolation — stamp the tenant onto every new customer
            if (tenantId != null) {
                com.pigmypay.PSolutions.model.Tenant tenant =
                        new com.pigmypay.PSolutions.model.Tenant();
                tenant.setId(tenantId);
                newCustomer.setTenant(tenant);
            }

            Customer savedCustomer = customerRepository.save(newCustomer);
            return ResponseEntity.ok(savedCustomer);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving customer: " + e.getMessage());
        }
    }
}