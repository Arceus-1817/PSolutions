package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.AgentShift;
import com.pigmypay.PSolutions.model.Branch;
import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.model.Route;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.AgentShiftRepository;
import com.pigmypay.PSolutions.repository.BranchRepository;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import com.pigmypay.PSolutions.repository.RouteRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired private RouteRepository routeRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private AgentShiftRepository agentShiftRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BranchRepository branchRepository; // 🚨 Added this!
    @Autowired private JwtService jwtService;
    @Autowired private com.pigmypay.PSolutions.repository.LoanRepository loanRepository;

    private String extractToken(String authHeader) {
        return authHeader.substring(7);
    }

    @GetMapping
    public ResponseEntity<?> getRoutes(@RequestHeader("Authorization") String authHeader) {
        User user = userRepository.findByEmail(jwtService.extractUsername(extractToken(authHeader))).orElseThrow();
        return ResponseEntity.ok(routeRepository.findByTenantId(user.getTenant().getId()));
    }

    @PostMapping("/create")
    public ResponseEntity<?> createRoute(@RequestBody Map<String, Object> payload, @RequestHeader("Authorization") String authHeader) {
        try {
            User manager = userRepository.findByEmail(jwtService.extractUsername(extractToken(authHeader))).orElseThrow();
            Route route = new Route();
            route.setName(payload.get("routeName").toString());
            route.setTenant(manager.getTenant());

            // 🚨 BULLETPROOF FIX: Prevent Hibernate from crashing on null branch_id
            if (manager.getBranch() != null) {
                route.setBranch(manager.getBranch());
            } else {
                List<Branch> allBranches = branchRepository.findByTenantId(manager.getTenant().getId());
                if (allBranches.isEmpty()) {
                    return ResponseEntity.badRequest().body("CRITICAL ERROR: You must create at least one Branch in the Branches tab before creating a Route!");
                }
                route.setBranch(allBranches.get(0)); // Attach to first branch safely
            }

            return ResponseEntity.ok(routeRepository.save(route));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to save Route: " + e.getMessage());
        }
    }

    @PostMapping("/assign-customer")
    public ResponseEntity<?> assignCustomer(@RequestBody Map<String, Object> payload) {
        Customer customer = customerRepository.findById(Long.valueOf(payload.get("customerId").toString())).orElseThrow();
        Route route = routeRepository.findById(Long.valueOf(payload.get("routeId").toString())).orElseThrow();
        customer.setRoute(route);
        customer.setRouteSequence(Integer.valueOf(payload.get("routeSequence").toString()));
        return ResponseEntity.ok(customerRepository.save(customer));
    }

    @PostMapping("/assign-shift")
    public ResponseEntity<?> assignShift(@RequestBody Map<String, Object> payload) {
        User agent = userRepository.findById(Long.valueOf(payload.get("agentId").toString())).orElseThrow();
        Route route = routeRepository.findById(Long.valueOf(payload.get("routeId").toString())).orElseThrow();

        AgentShift shift = new AgentShift();
        shift.setAgent(agent);
        shift.setRoute(route);
        shift.setStartDate(LocalDate.now());
        shift.setStatus("ACTIVE");
        shift.setTenant(agent.getTenant());
        return ResponseEntity.ok(agentShiftRepository.save(shift));
    }

    @GetMapping("/my-daily-route")
    public ResponseEntity<?> getMyDailyRoute(@RequestHeader("Authorization") String authHeader) {
        User agent = userRepository.findByEmail(jwtService.extractUsername(extractToken(authHeader))).orElseThrow();
        List<AgentShift> activeShifts = agentShiftRepository.findByAgentIdAndStatus(agent.getId(), "ACTIVE");

        if (activeShifts.isEmpty()) return ResponseEntity.ok(List.of());

        List<Customer> routeCustomers = customerRepository.findByRouteIdOrderByRouteSequenceAsc(activeShifts.get(0).getRoute().getId());

        // 🚨 ADD THIS LOOP: Check every customer for an active loan and attach the EMI
        for (Customer c : routeCustomers) {
            List<com.pigmypay.PSolutions.model.Loan> loans = loanRepository.findByCustomerIdAndStatus(c.getId(), "ACTIVE");
            if (!loans.isEmpty()) {
                c.setActiveDailyEmi(loans.get(0).getDailyEmiAmount());
            } else {
                c.setActiveDailyEmi(java.math.BigDecimal.ZERO);
            }
        }

        return ResponseEntity.ok(routeCustomers);
    }
}