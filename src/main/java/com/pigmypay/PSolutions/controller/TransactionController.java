package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.dto.DepositRequest;
import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.model.Loan;
import com.pigmypay.PSolutions.model.Transaction;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import com.pigmypay.PSolutions.repository.LoanRepository;
import com.pigmypay.PSolutions.repository.TransactionRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.security.JwtService;
import com.pigmypay.PSolutions.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired private TransactionService transactionService;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private LoanRepository loanRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CustomerRepository customerRepository; // ADDED for cross-tenant security checks
    @Autowired private JwtService jwtService;

    // Helper: extracts the raw token string from the "Bearer xyz" header
    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new RuntimeException("Missing or invalid Authorization header");
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> makeDeposit(
            @RequestBody DepositRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);
            String userEmail = jwtService.extractUsername(token);

            // Fetch the user actually making the request
            User agent = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Agent not found"));

            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            // SECURITY WALL: Prevent depositing money into a customer's account in a different company
            if (!customer.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: Customer belongs to a different tenant.");
            }

            // SECURITY WALL: Ignore request.getAgentId(). Force the transaction under the logged-in token's user ID
            Transaction savedTransaction = transactionService.recordDeposit(
                    customer.getId(), agent.getId(),
                    request.getAmount(), request.getPaymentMode());

            return ResponseEntity.ok(savedTransaction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/history/{customerId}")
    public ResponseEntity<?> getCustomerHistory(
            @PathVariable Long customerId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);

            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            // SECURITY WALL: Prevent fetching history for a customer in a different company
            if (!customer.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: Customer belongs to a different tenant.");
            }

            List<Transaction> history = transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customerId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching history: " + e.getMessage());
        }
    }

    @GetMapping("/recent/{tenantId}")
    public ResponseEntity<?> getRecentTransactionsForTenant(
            @PathVariable Long tenantId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);
            String userEmail = jwtService.extractUsername(token);

            // SECURITY WALL: Ensure they are requesting their own tenant's feed
            if (!tenantId.equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: Cannot view feed for a different tenant.");
            }

            User requestingUser = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String role = requestingUser.getRole().name();

            if (role.equals("ADMIN") || role.equals("SYSTEM_ADMIN")) {
                return ResponseEntity.ok(transactionRepository.findAll().stream()
                        .filter(t -> t.getCustomer().getTenant().getId().equals(tokenTenantId))
                        .toList());
            }
            else if (role.equals("MANAGER")) {
                Long branchId = requestingUser.getBranch().getId();
                return ResponseEntity.ok(transactionRepository.findAll().stream()
                        .filter(t -> t.getAgent() != null && t.getAgent().getBranch() != null)
                        .filter(t -> t.getAgent().getBranch().getId().equals(branchId))
                        .toList());
            }
            else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/loan-emi")
    public ResponseEntity<?> payLoanEmi(
            @RequestBody DepositRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);
            String userEmail = jwtService.extractUsername(token);

            User agent = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Agent not found"));

            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            // SECURITY WALL: Verify cross-tenant isolation
            if (!customer.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: Customer belongs to a different tenant.");
            }

            // 1. SECURE: Record the transaction using the authenticated agent's ID
            Transaction emiPayment = transactionService.recordDeposit(
                    customer.getId(), agent.getId(),
                    request.getAmount(), request.getPaymentMode());

            // 2. Mark this transaction specifically as a LOAN_REPAYMENT
            emiPayment.setTransactionCategory("LOAN_REPAYMENT");

            // 3. Find the customer's ACTIVE loan and update the balance
            List<Loan> activeLoans = loanRepository.findByCustomerIdAndStatus(customer.getId(), "ACTIVE");
            if (activeLoans.isEmpty()) {
                throw new RuntimeException("Customer has no active loans to pay off.");
            }

            Loan currentLoan = activeLoans.get(0);
            BigDecimal newPaidTotal = currentLoan.getAmountPaid().add(request.getAmount());
            currentLoan.setAmountPaid(newPaidTotal);

            // 4. Check if the loan is fully paid off
            if (currentLoan.getAmountPaid().compareTo(currentLoan.getTotalAmountDue()) >= 0) {
                currentLoan.setStatus("CLOSED");
                currentLoan.setEndDate(LocalDate.now());
            }

            loanRepository.save(currentLoan);
            transactionRepository.save(emiPayment);

            return ResponseEntity.ok(emiPayment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("EMI Payment failed: " + e.getMessage());
        }
    }
}