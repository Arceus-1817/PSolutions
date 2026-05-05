package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.dto.DepositRequest;
import com.pigmypay.PSolutions.model.Transaction;
import com.pigmypay.PSolutions.repository.TransactionRepository;
import com.pigmypay.PSolutions.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    // Add the repository here so we can read directly from the database
    @Autowired
    private TransactionRepository transactionRepository;

    @PostMapping("/deposit")
    public ResponseEntity<?> makeDeposit(@RequestBody DepositRequest request) {
        // ... (Keep your existing makeDeposit code exactly as it is) ...
        try {
            Transaction savedTransaction = transactionService.recordDeposit(
                    request.getCustomerId(), request.getAgentId(),
                    request.getAmount(), request.getPaymentMode());
            return ResponseEntity.ok(savedTransaction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- ADD THIS NEW METHOD ---
    // This listens for GET requests to /api/transactions/history/{customerId}
    @GetMapping("/history/{customerId}")
    public ResponseEntity<?> getCustomerHistory(@PathVariable Long customerId) {
        try {
            // Fetches all transactions for a customer, sorted by newest first
            List<Transaction> history = transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customerId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching history: " + e.getMessage());
        }
    }
}