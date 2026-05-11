package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.dto.DepositRequest;
import com.pigmypay.PSolutions.model.Loan;
import com.pigmypay.PSolutions.model.Transaction;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.LoanRepository;
import com.pigmypay.PSolutions.repository.TransactionRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.security.JwtService;
import com.pigmypay.PSolutions.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Autowired
    private LoanRepository loanRepository;

    @Autowired private UserRepository userRepository;
    @Autowired private JwtService jwtService;

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

    // ADD THIS: Allows Admin Dashboard to fetch recent activity


    // ── GET recent activity feed (STRICT HIERARCHY) ────────────────────────
    @GetMapping("/recent/{tenantId}")
    public ResponseEntity<?> getRecentTransactionsForTenant(
            @PathVariable Long tenantId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            User requestingUser = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String role = requestingUser.getRole().name();

            if (role.equals("ADMIN") || role.equals("SYSTEM_ADMIN")) {
                // Head Office: Sees all company transactions
                // Note: In a real app, you'd use a custom query to limit to the last 50 to save memory
                return ResponseEntity.ok(transactionRepository.findAll().stream()
                        .filter(t -> t.getCustomer().getTenant().getId().equals(tenantId))
                        .toList());
            }
            else if (role.equals("MANAGER")) {
                // Branch Manager: Sees ONLY transactions made by their agents
                Long branchId = requestingUser.getBranch().getId();
                return ResponseEntity.ok(transactionRepository.findAll().stream()
                        .filter(t -> t.getAgent() != null && t.getAgent().getBranch() != null)
                        .filter(t -> t.getAgent().getBranch().getId().equals(branchId))
                        .toList());
            }
            else {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }


    // POST /api/transactions/loan-emi
    @PostMapping("/loan-emi")
    public ResponseEntity<?> payLoanEmi(@RequestBody DepositRequest request) {
        try {
            // 1. Record the transaction in the database
            Transaction emiPayment = transactionService.recordDeposit(
                    request.getCustomerId(), request.getAgentId(),
                    request.getAmount(), request.getPaymentMode());

            // 2. Mark this transaction specifically as a LOAN_REPAYMENT
            emiPayment.setTransactionCategory("LOAN_REPAYMENT");

            // 3. Find the customer's ACTIVE loan and update the balance
            List<Loan> activeLoans = loanRepository.findByCustomerIdAndStatus(request.getCustomerId(), "ACTIVE");
            if (activeLoans.isEmpty()) {
                throw new RuntimeException("Customer has no active loans to pay off.");
            }

            // Assuming 1 active loan at a time for microfinance
            Loan currentLoan = activeLoans.get(0);

            // Add the EMI amount to the "amountPaid" tally
            BigDecimal newPaidTotal = currentLoan.getAmountPaid().add(request.getAmount());
            currentLoan.setAmountPaid(newPaidTotal);

            // 4. Check if the loan is fully paid off!
            if (currentLoan.getAmountPaid().compareTo(currentLoan.getTotalAmountDue()) >= 0) {
                currentLoan.setStatus("CLOSED");
                currentLoan.setEndDate(LocalDate.now());
            }

            loanRepository.save(currentLoan);
            transactionRepository.save(emiPayment); // Save the category update

            return ResponseEntity.ok(emiPayment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("EMI Payment failed: " + e.getMessage());
        }
    }
}