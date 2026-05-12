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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private LoanRepository loanRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private JwtService jwtService;

    // Helper: extracts the raw token string
    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new RuntimeException("Missing or invalid Authorization header");
    }

    @GetMapping("/demand/{loanId}")
    public ResponseEntity<?> getTodaysDemand(@PathVariable Long loanId, @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);

            Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));

            if (!loan.getCustomer().getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
            }

            BigDecimal totalDemand = loan.getDailyEmiAmount()
                    .add(loan.getArrearsBalance() != null ? loan.getArrearsBalance() : BigDecimal.ZERO)
                    .add(loan.getPenaltyCharges() != null ? loan.getPenaltyCharges() : BigDecimal.ZERO);

            Map<String, Object> response = new HashMap<>();
            response.put("loanId", loan.getId());
            response.put("dailyEmi", loan.getDailyEmiAmount());
            response.put("arrears", loan.getArrearsBalance());
            response.put("penalties", loan.getPenaltyCharges());
            response.put("totalDemandToday", totalDemand);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> makeDeposit(
            @RequestBody DepositRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);
            String userEmail = jwtService.extractUsername(token);

            User agent = userRepository.findByEmail(userEmail).orElseThrow();
            Customer customer = customerRepository.findById(request.getCustomerId()).orElseThrow();

            if (customer.getTenant() != null && !customer.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied.");
            }

            validateAgentCashLimit(agent, request.getAmount());

            customer.setCurrentBalance(customer.getCurrentBalance().add(request.getAmount()));
            customerRepository.save(customer);

            Transaction savedTransaction = new Transaction();
            savedTransaction.setCustomer(customer);
            savedTransaction.setAgent(agent);
            savedTransaction.setAmount(request.getAmount());
            savedTransaction.setPaymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "CASH");
            savedTransaction.setTransactionType("DEPOSIT");
            savedTransaction.setTransactionDate(LocalDateTime.now());
            savedTransaction.setTenant(agent.getTenant());
            savedTransaction.setTransactionCategory("SAVINGS_DEPOSIT");
            savedTransaction.setSettlementStatus("UNSETTLED");

            transactionRepository.save(savedTransaction);

            return ResponseEntity.ok(savedTransaction);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
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

            User agent = userRepository.findByEmail(userEmail).orElseThrow();
            Customer customer = customerRepository.findById(request.getCustomerId()).orElseThrow();

            if (customer.getTenant() != null && !customer.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied.");
            }

            validateAgentCashLimit(agent, request.getAmount());

            List<Loan> activeLoans = loanRepository.findByCustomerIdAndStatus(customer.getId(), "ACTIVE");
            if (activeLoans.isEmpty()) {
                throw new RuntimeException("Customer has no active loans.");
            }

            Loan currentLoan = activeLoans.get(0);
            BigDecimal amountCollected = request.getAmount();

            currentLoan.setAmountPaid(currentLoan.getAmountPaid().add(amountCollected));

            if (amountCollected.compareTo(currentLoan.getDailyEmiAmount()) > 0) {
                BigDecimal extraMoney = amountCollected.subtract(currentLoan.getDailyEmiAmount());

                if (currentLoan.getArrearsBalance() != null && currentLoan.getArrearsBalance().compareTo(BigDecimal.ZERO) > 0) {
                    if (extraMoney.compareTo(currentLoan.getArrearsBalance()) >= 0) {
                        extraMoney = extraMoney.subtract(currentLoan.getArrearsBalance());
                        currentLoan.setArrearsBalance(BigDecimal.ZERO);
                    } else {
                        currentLoan.setArrearsBalance(currentLoan.getArrearsBalance().subtract(extraMoney));
                        extraMoney = BigDecimal.ZERO;
                    }
                }

                if (extraMoney.compareTo(BigDecimal.ZERO) > 0 && currentLoan.getPenaltyCharges() != null && currentLoan.getPenaltyCharges().compareTo(BigDecimal.ZERO) > 0) {
                    if (extraMoney.compareTo(currentLoan.getPenaltyCharges()) >= 0) {
                        currentLoan.setPenaltyCharges(BigDecimal.ZERO);
                    } else {
                        currentLoan.setPenaltyCharges(currentLoan.getPenaltyCharges().subtract(extraMoney));
                    }
                }
            }

            if (currentLoan.getAmountPaid().compareTo(currentLoan.getTotalAmountDue()) >= 0) {
                currentLoan.setStatus("CLOSED");
                currentLoan.setEndDate(LocalDate.now());
            }

            loanRepository.save(currentLoan);

            Transaction emiPayment = new Transaction();
            emiPayment.setCustomer(customer);
            emiPayment.setAgent(agent);
            emiPayment.setAmount(amountCollected);
            emiPayment.setPaymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "CASH");
            emiPayment.setTransactionType("DEPOSIT");
            emiPayment.setTransactionDate(LocalDateTime.now());
            emiPayment.setTenant(agent.getTenant());
            emiPayment.setTransactionCategory("LOAN_REPAYMENT");
            emiPayment.setSettlementStatus("UNSETTLED");
            emiPayment.setAssociatedLoan(currentLoan);

            transactionRepository.save(emiPayment);

            return ResponseEntity.ok(emiPayment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("EMI Payment failed: " + e.getMessage());
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

            if (customer.getTenant() != null && tokenTenantId != null) {
                if (!customer.getTenant().getId().equals(tokenTenantId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
                }
            }

            List<Transaction> history = transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customerId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
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

            if (!tenantId.equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
            }

            User requestingUser = userRepository.findByEmail(userEmail).orElseThrow();
            String role = requestingUser.getRole().name();

            if (role.equals("ADMIN") || role.equals("SYSTEM_ADMIN")) {
                return ResponseEntity.ok(transactionRepository.findAll().stream()
                        .filter(t -> t.getTenant() != null && t.getTenant().getId().equals(tokenTenantId))
                        .toList());
            } else if (role.equals("MANAGER")) {
                Long branchId = requestingUser.getBranch().getId();
                return ResponseEntity.ok(transactionRepository.findAll().stream()
                        .filter(t -> t.getAgent() != null && t.getAgent().getBranch() != null)
                        .filter(t -> t.getAgent().getBranch().getId().equals(branchId))
                        .toList());
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    private void validateAgentCashLimit(User agent, BigDecimal incomingAmount) {
        List<Transaction> unsettledCash = transactionRepository.findByAgentIdAndSettlementStatus(agent.getId(), "UNSETTLED");
        BigDecimal currentHolding = BigDecimal.ZERO;
        for (Transaction t : unsettledCash) {
            currentHolding = currentHolding.add(t.getAmount());
        }
        BigDecimal projectedHolding = currentHolding.add(incomingAmount);

        if (projectedHolding.compareTo(agent.getMaxCashHoldingLimit()) > 0) {
            throw new RuntimeException("CASH LIMIT EXCEEDED: You are holding ₹" + currentHolding +
                    ". Collecting this ₹" + incomingAmount + " exceeds your limit of ₹" +
                    agent.getMaxCashHoldingLimit() + ". Please return to the branch and settle cash immediately.");
        }
    }
}