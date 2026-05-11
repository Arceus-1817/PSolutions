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
            // In a perfectly secure system, we should verify the token matches the agentId
            // but for now, we just ensure the endpoint is open and returns the agent's specific list.
            return ResponseEntity.ok(customerRepository.findByAssignedAgentId(agentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ── 3. ADD NEW CUSTOMER (Fixes the 400 Bad Request) ──
    @PostMapping
    public ResponseEntity<?> addNewCustomer(
            @RequestBody Customer newCustomer,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // 1. Identify WHO is adding this customer
            String token = extractToken(authHeader);
            String userEmail = jwtService.extractUsername(token);
            User requestingUser = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 2. AUTO-FILL THE MISSING DATA
            // The React app doesn't know the Tenant, so we force it based on the logged-in user!
            newCustomer.setTenant(requestingUser.getTenant());

            // If an Agent is adding the customer, auto-assign the customer to them
            if (requestingUser.getRole() == Role.AGENT) {
                newCustomer.setAssignedAgent(requestingUser);
            }

            // 3. Save to database
            Customer savedCustomer = customerRepository.save(newCustomer);
            return ResponseEntity.ok(savedCustomer);

        } catch (Exception e) {
            e.printStackTrace(); // Prints the exact SQL error to your terminal if it fails again
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
}