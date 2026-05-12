package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.model.Role;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired private CustomerRepository customerRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtService jwtService;
    @Autowired private com.pigmypay.PSolutions.repository.RouteRepository routeRepository;
    @Autowired private com.pigmypay.PSolutions.repository.AgentShiftRepository agentShiftRepository;

    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new RuntimeException("Missing Authorization header");
    }

    // ── 1. GET ALL CUSTOMERS (The Admin/Manager Dashboard Endpoint) ──
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<?> getAllCustomersForTenant(
            @PathVariable Long tenantId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            String userEmail = jwtService.extractUsername(token);
            User requestingUser = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Role role = requestingUser.getRole();

            if (role == Role.SYSTEM_ADMIN || role == Role.ADMIN) {
                // Head Office sees everyone in the company
                return ResponseEntity.ok(customerRepository.findByTenantId(tenantId));
            } else if (role == Role.MANAGER) {
                // Branch Manager sees ONLY customers belonging to their branch
                Long branchId = requestingUser.getBranch().getId();
                return ResponseEntity.ok(customerRepository.findByAssignedAgentBranchId(branchId));
            } else {
                return ResponseEntity.status(403).body("Access Denied: Agents should use the mobile endpoint.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ── 2. GET AGENT'S CUSTOMERS (The Mobile App Endpoint) ──
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getCustomersForAgent(
            @PathVariable Long agentId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Validate the token belongs to this exact agent (prevents agent A from querying agent B)
            String token = extractToken(authHeader);
            String userEmail = jwtService.extractUsername(token);
            User tokenUser = userRepository.findByEmail(userEmail).orElseThrow();

            if (!tokenUser.getId().equals(agentId)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body("SECURITY VIOLATION: You can only fetch your own assigned route.");
            }

            // 🚨 STRICT ROUTE ENFORCEMENT: Find what route they are walking TODAY
            java.util.List<com.pigmypay.PSolutions.model.AgentShift> activeShifts =
                    agentShiftRepository.findByAgentIdAndStatus(agentId, "ACTIVE");

            if (activeShifts.isEmpty()) {
                // They have no route assigned today. Return an empty list.
                return ResponseEntity.ok(java.util.List.of());
            }

            Long todaysRouteId = activeShifts.get(0).getRoute().getId();

            // Return only the customers physically on today's route, ordered perfectly!
            return ResponseEntity.ok(customerRepository.findByRouteIdOrderByRouteSequenceAsc(todaysRouteId));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ── 3. ADD NEW CUSTOMER (Fixes the 400 Bad Request) ──
    @PostMapping
    public ResponseEntity<?> addNewCustomer(
            @RequestBody Customer newCustomer,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            String userEmail = jwtService.extractUsername(token);
            User requestingUser = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 🚨 THE ENTERPRISE HARD BLOCK 🚨
            // If the user is an AGENT, violently reject the request.
            if (requestingUser.getRole() == com.pigmypay.PSolutions.model.Role.AGENT) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body("SECURITY VIOLATION: Field Agents are not authorized to create new customer accounts. Please direct the customer to the Branch Manager for KYC onboarding.");
            }

            // If they pass the check, assign the correct company tenant
            newCustomer.setTenant(requestingUser.getTenant());

            Customer savedCustomer = customerRepository.save(newCustomer);
            return ResponseEntity.ok(savedCustomer);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to save customer: " + e.getMessage());
        }
    }

    @PutMapping("/{customerId}/route/{routeId}")
    public ResponseEntity<?> assignCustomerToRoute(
            @PathVariable Long customerId,
            @PathVariable Long routeId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            com.pigmypay.PSolutions.model.Route route = routeRepository.findById(routeId)
                    .orElseThrow(() -> new RuntimeException("Route not found"));

            customer.setRoute(route);

            // Optionally, assign the customer to the Agent who manages this route by default
            if (route.getAssignedAgent() != null) {
                customer.setAssignedAgent(route.getAssignedAgent());
            }

            customerRepository.save(customer);
            return ResponseEntity.ok("Customer successfully moved to route: " + route.getName());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Routing failed: " + e.getMessage());
        }
    }

    // ── 5. BULK UPDATE ROUTE SEQUENCE ──
    @PutMapping("/route/{routeId}/sequence")
    public ResponseEntity<?> updateRouteSequence(
            @PathVariable Long routeId,
            @RequestBody java.util.List<Long> orderedCustomerIds,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Note: In production, verify the user has Manager access to this route
            for (int i = 0; i < orderedCustomerIds.size(); i++) {
                Long customerId = orderedCustomerIds.get(i);
                Customer c = customerRepository.findById(customerId).orElse(null);

                // Only update if the customer actually belongs to this route
                if (c != null && c.getRoute() != null && c.getRoute().getId().equals(routeId)) {
                    c.setRouteSequence(i + 1); // 1-based indexing for humans
                    customerRepository.save(c);
                }
            }
            return ResponseEntity.ok("Route sequence successfully optimized.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update sequence: " + e.getMessage());
        }
    }

    // ── UPDATE KYC DETAILS ──
    @PutMapping("/{customerId}/kyc")
    public ResponseEntity<?> updateKyc(@PathVariable Long customerId, @RequestBody Customer kycData) {
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            customer.setAadharNumber(kycData.getAadharNumber());
            customer.setPanNumber(kycData.getPanNumber());
            customer.setResidentialAddress(kycData.getResidentialAddress());
            customer.setGuarantorName(kycData.getGuarantorName());
            customer.setGuarantorPhoneNumber(kycData.getGuarantorPhoneNumber());
            customer.setKycStatus("VERIFIED");

            return ResponseEntity.ok(customerRepository.save(customer));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("KYC failed: " + e.getMessage());
        }
    }
}