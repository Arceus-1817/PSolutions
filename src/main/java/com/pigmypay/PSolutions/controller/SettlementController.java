package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Transaction;
import com.pigmypay.PSolutions.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin
@RequestMapping("/api/settlements")
public class SettlementController {

    @Autowired
    private TransactionRepository transactionRepository;

    // 1. View all cash currently in Agent pockets (UNSETTLED)
    @GetMapping("/pending/{tenantId}")
    public ResponseEntity<?> getPendingSettlements(@PathVariable Long tenantId) {
        try {
            // Find all transactions that haven't been handed to the manager yet
            List<Transaction> unsettledTxns = transactionRepository.findAll().stream()
                    .filter(t -> "UNSETTLED".equals(t.getSettlementStatus()))
                    // Assuming you have a way to filter by tenant. If not, just filter by UNSETTLED for now.
                    .collect(Collectors.toList());

            // Group the transactions by the Agent's Name and calculate the total cash they hold
            Map<String, Map<String, Object>> agentTotals = unsettledTxns.stream()
                    .filter(t -> t.getAgent() != null)
                    .collect(Collectors.groupingBy(
                            t -> t.getAgent().getName() + "|" + t.getAgent().getId(), // Group by Agent
                            Collectors.collectingAndThen(Collectors.toList(), list -> {
                                BigDecimal totalCash = list.stream()
                                        .map(t -> t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                return Map.of(
                                        "totalCash", totalCash,
                                        "transactionCount", list.size(),
                                        "transactions", list // Keep the raw list in case the manager wants to see it
                                );
                            })
                    ));

            return ResponseEntity.ok(agentTotals);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to load settlements: " + e.getMessage());
        }
    }

    // 2. The Manager confirms they received the physical cash
    @PostMapping("/confirm/{agentId}")
    public ResponseEntity<?> confirmCashHandover(@PathVariable Long agentId) {
        try {
            // Find all unsettled money for this specific agent
            List<Transaction> agentTxns = transactionRepository.findAll().stream()
                    .filter(t -> "UNSETTLED".equals(t.getSettlementStatus()) && t.getAgent() != null && t.getAgent().getId().equals(agentId))
                    .collect(Collectors.toList());

            if (agentTxns.isEmpty()) {
                return ResponseEntity.badRequest().body("No pending cash to settle for this agent.");
            }

            // Mark them all as safely in the bank/branch safe
            agentTxns.forEach(t -> t.setSettlementStatus("SETTLED"));
            transactionRepository.saveAll(agentTxns);

            return ResponseEntity.ok("Cash settlement confirmed successfully. Safe updated.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Settlement failed: " + e.getMessage());
        }
    }
}