package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.model.Loan;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import com.pigmypay.PSolutions.repository.LoanRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired private LoanRepository loanRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtService jwtService;

    // Helper: extracts the raw token string
    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new RuntimeException("Missing or invalid Authorization header");
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getCustomerLoans(@PathVariable Long customerId) {
        try {
            return ResponseEntity.ok(loanRepository.findByCustomerId(customerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching loans: " + e.getMessage());
        }
    }

    /**
     * 1. MAKER: Branch Manager requests a loan
     */
    @PostMapping("/issue/{customerId}")
    public ResponseEntity<?> requestLoan(
            @PathVariable Long customerId,
            @RequestBody Map<String, Object> payload,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);
            String userEmail = jwtService.extractUsername(token);

            User manager = userRepository.findByEmail(userEmail).orElseThrow();

            Customer customer = customerRepository.findById(customerId).orElseThrow();

            // SECURITY WALL
            if (!customer.getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied.");
            }

            Loan newLoan = new Loan();
            newLoan.setCustomer(customer);
            newLoan.setPrincipalAmount(new BigDecimal(payload.get("principalAmount").toString()));
            newLoan.setInterestRate(Double.valueOf(payload.get("interestRate").toString()));

            // Calculate Total Due and EMI
            BigDecimal principal = newLoan.getPrincipalAmount();
            BigDecimal totalInterest = principal.multiply(BigDecimal.valueOf(newLoan.getInterestRate()).divide(BigDecimal.valueOf(100)));
            BigDecimal totalDue = principal.add(totalInterest);
            BigDecimal dailyEmi = totalDue.divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.CEILING);

            newLoan.setTotalAmountDue(totalDue);
            newLoan.setDailyEmiAmount(dailyEmi);

            // Microfinance Processing Fee Math (e.g., 2% upfront)
            BigDecimal processingFee = principal.multiply(BigDecimal.valueOf(0.02));
            newLoan.setProcessingFeeAmount(processingFee);

            // 🚨 THE MAKER-CHECKER LOCK
            newLoan.setStatus("PENDING_APPROVAL");
            newLoan.setAmountPaid(BigDecimal.ZERO);
            newLoan.setPenaltyCharges(BigDecimal.ZERO);
            newLoan.setArrearsBalance(BigDecimal.ZERO);
            newLoan.setConsecutiveMissedDays(0);

            loanRepository.save(newLoan);

            return ResponseEntity.ok(newLoan);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error requesting loan: " + e.getMessage());
        }
    }

    /**
     * 2. FETCH PENDING LOANS (For the Admin Dashboard)
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingLoans(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);

            // Fetch all pending loans, but strictly filter for the logged-in user's company
            List<Loan> pendingLoans = loanRepository.findAll().stream()
                    .filter(loan -> "PENDING_APPROVAL".equals(loan.getStatus()))
                    .filter(loan -> loan.getCustomer().getTenant().getId().equals(tokenTenantId))
                    .toList();

            return ResponseEntity.ok(pendingLoans);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 3. CHECKER: Admin Approves the Loan
     */
    @PutMapping("/approve/{loanId}")
    public ResponseEntity<?> approveLoan(
            @PathVariable Long loanId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            Long tokenTenantId = jwtService.extractTenantId(token);
            String userEmail = jwtService.extractUsername(token);

            User admin = userRepository.findByEmail(userEmail).orElseThrow();

            // 🚨 SECURITY WALL: Only Admin or System Admin can approve
            if (!admin.getRole().name().equals("ADMIN") && !admin.getRole().name().equals("SYSTEM_ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ADMIN can approve loans.");
            }

            Loan loan = loanRepository.findById(loanId)
                    .orElseThrow(() -> new RuntimeException("Loan not found"));

            if (!loan.getCustomer().getTenant().getId().equals(tokenTenantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied.");
            }

            if (!loan.getStatus().equals("PENDING_APPROVAL")) {
                return ResponseEntity.badRequest().body("Loan is not in a pending state.");
            }

            // Disburse the money & start the clock
            loan.setStatus("ACTIVE");
            loan.setStartDate(LocalDate.now());

            // Auto-Calculate the physical end date based on Total Due / Daily EMI
            int totalDays = loan.getTotalAmountDue().divide(loan.getDailyEmiAmount(), java.math.RoundingMode.UP).intValue();
            loan.setEndDate(LocalDate.now().plusDays(totalDays));

            loanRepository.save(loan);

            return ResponseEntity.ok("Loan approved and disbursed!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error approving loan: " + e.getMessage());
        }
    }
}