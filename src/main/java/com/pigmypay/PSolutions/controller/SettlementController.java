package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Transaction;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/settlements")
public class SettlementController {

    @Autowired private TransactionRepository transactionRepository;

    @GetMapping("/pending/{tenantId}")
    public ResponseEntity<?> getPendingSettlementsForTenant(@PathVariable Long tenantId) {
        try {
            List<Transaction> allUnsettled = transactionRepository.findAll().stream()
                    .filter(t -> "UNSETTLED".equals(t.getSettlementStatus()))
                    .filter(t -> t.getAgent() != null && t.getAgent().getTenant() != null && t.getAgent().getTenant().getId().equals(tenantId))
                    .toList();

            Map<String, Map<String, Object>> response = new HashMap<>();

            for (Transaction t : allUnsettled) {
                User agent = t.getAgent();
                String key = agent.getName() + "|" + agent.getId();

                response.putIfAbsent(key, new HashMap<>(Map.of(
                        "totalCash", BigDecimal.ZERO,
                        "transactionCount", 0
                )));

                Map<String, Object> agentData = response.get(key);
                BigDecimal currentTotal = (BigDecimal) agentData.get("totalCash");
                int currentCount = (int) agentData.get("transactionCount");

                agentData.put("totalCash", currentTotal.add(t.getAmount()));
                agentData.put("transactionCount", currentCount + 1);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/confirm/{agentId}")
    public ResponseEntity<?> confirmSettlement(@PathVariable Long agentId) {
        try {
            List<Transaction> unsettled = transactionRepository.findAll().stream()
                    .filter(t -> "UNSETTLED".equals(t.getSettlementStatus()))
                    .filter(t -> t.getAgent() != null && t.getAgent().getId().equals(agentId))
                    .toList();

            for (Transaction t : unsettled) {
                t.setSettlementStatus("SETTLED");
            }
            transactionRepository.saveAll(unsettled);

            return ResponseEntity.ok("Successfully settled " + unsettled.size() + " transactions.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}