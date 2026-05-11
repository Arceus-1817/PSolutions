package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import com.pigmypay.PSolutions.repository.TransactionRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.repository.BranchRepository;
import com.pigmypay.PSolutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired private UserRepository userRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private JwtService jwtService;

    // 🔴 THE MISSING ANNOTATION WAS HERE!
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<?> getTenantStats(
            @PathVariable Long tenantId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            User requestingUser = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String role = requestingUser.getRole().name();

            // If they are a MANAGER, instantly re-route them to the Branch Stats logic
            if (role.equals("MANAGER")) {
                return getBranchStats(requestingUser.getBranch().getId());
            }

            // Otherwise, they are an ADMIN. Run company-wide calculations:
            var users     = userRepository.findByTenantId(tenantId);
            var customers = customerRepository.findByTenantId(tenantId);
            var branches  = branchRepository.findByTenantId(tenantId);

            long agentCount   = users.stream().filter(u -> "AGENT".equals(u.getRole().name())).count();
            long managerCount = users.stream().filter(u -> "MANAGER".equals(u.getRole().name())).count();

            BigDecimal totalPortfolio = customers.stream()
                    .map(c -> c.getCurrentBalance() != null ? c.getCurrentBalance() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Today's collections
            LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
            var todayTxns = transactionRepository
                    .findByCustomerTenantIdAndTransactionDateAfter(tenantId, startOfDay);

            // Updated to check getTransactionCategory() or getTransactionType() depending on your model
            BigDecimal todayCollection = todayTxns.stream()
                    // If you renamed this to getTransactionCategory() earlier, use that here!
                    .filter(t -> "DEPOSIT".equals(t.getTransactionType()) || "SAVINGS_DEPOSIT".equals(t.getTransactionCategory()))
                    .map(t -> t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long todayTxnCount = todayTxns.stream()
                    .filter(t -> "DEPOSIT".equals(t.getTransactionType()) || "SAVINGS_DEPOSIT".equals(t.getTransactionCategory()))
                    .count();

            // Per-branch agent counts
            Map<Long, Long> agentsPerBranch = users.stream()
                    .filter(u -> u.getBranch() != null)
                    .collect(Collectors.groupingBy(u -> u.getBranch().getId(), Collectors.counting()));

            // Per-branch customer counts
            Map<Long, Long> customersPerBranch = customers.stream()
                    .filter(c -> c.getAssignedAgent() != null && c.getAssignedAgent().getBranch() != null)
                    .collect(Collectors.groupingBy(
                            c -> c.getAssignedAgent().getBranch().getId(), Collectors.counting()));

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("agentCount",       agentCount);
            stats.put("managerCount",      managerCount);
            stats.put("customerCount",     (long) customers.size());
            stats.put("branchCount",       (long) branches.size());
            stats.put("totalPortfolio",    totalPortfolio);
            stats.put("todayCollection",   todayCollection);
            stats.put("todayTxnCount",     todayTxnCount);
            stats.put("agentsPerBranch",   agentsPerBranch);
            stats.put("customersPerBranch",customersPerBranch);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Stats error: " + e.getMessage());
        }
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<?> getBranchStats(@PathVariable Long branchId) {
        try {
            var agents    = userRepository.findByBranchId(branchId);
            var customers = customerRepository.findByAssignedAgentBranchId(branchId);

            long agentCount = agents.stream().filter(u -> "AGENT".equals(u.getRole().name())).count();

            BigDecimal branchPortfolio = customers.stream()
                    .map(c -> c.getCurrentBalance() != null ? c.getCurrentBalance() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
            var branchTxns = transactionRepository.findByAgentBranchIdAndTransactionDateAfter(branchId, startOfDay);

            BigDecimal todayCollection = branchTxns.stream()
                    .filter(t -> "DEPOSIT".equals(t.getTransactionType()) || "SAVINGS_DEPOSIT".equals(t.getTransactionCategory()))
                    .map(t -> t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Per-agent collection today
            Map<String, BigDecimal> agentCollections = branchTxns.stream()
                    .filter(t -> "DEPOSIT".equals(t.getTransactionType()) || "SAVINGS_DEPOSIT".equals(t.getTransactionCategory()))
                    .collect(Collectors.groupingBy(
                            t -> t.getAgent() != null ? t.getAgent().getName() : "Unknown",
                            Collectors.mapping(
                                    t -> t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO,
                                    Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                            )
                    ));

            return ResponseEntity.ok(Map.of(
                    "agentCount",       agentCount,
                    "customerCount",    (long) customers.size(),
                    "branchPortfolio",  branchPortfolio,
                    "todayCollection",  todayCollection,
                    "agentCollections", agentCollections
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Branch stats error: " + e.getMessage());
        }
    }
}