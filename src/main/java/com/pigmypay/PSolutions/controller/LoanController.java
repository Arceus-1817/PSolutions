package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.model.Loan;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import com.pigmypay.PSolutions.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private CustomerRepository customerRepository;

    // GET /api/loans/customer/{customerId} -> View a customer's loan history
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getCustomerLoans(@PathVariable Long customerId) {
        try {
            List<Loan> loans = loanRepository.findByCustomerId(customerId);
            return ResponseEntity.ok(loans);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching loans: " + e.getMessage());
        }
    }

    // POST /api/loans/issue/{customerId} -> Manager issues a new loan
    // POST /api/loans/issue/{customerId} -> Manager issues a new loan
    @PostMapping("/issue/{customerId}")
    public ResponseEntity<?> issueLoan(@PathVariable Long customerId, @RequestBody Loan newLoan) {
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            // 1. Core Variables
            BigDecimal principal = newLoan.getPrincipalAmount();

            // 2. The "Hidden" Processing Fee (e.g., 2.5% Document/File Charge)
            // Real microfinance deducts this from the cash handed to the customer.
            BigDecimal processingFeeRate = BigDecimal.valueOf(0.025);
            BigDecimal processingFee = principal.multiply(processingFeeRate);

            // The customer asks for 10k, but they walk out the door with 9,750.
            BigDecimal disbursedCash = principal.subtract(processingFee);

            // 3. Flat Interest Calculation (Calculated on the FULL 10k)
            BigDecimal interestRateDec = BigDecimal.valueOf(newLoan.getInterestRate()).divide(BigDecimal.valueOf(100));
            BigDecimal totalInterest = principal.multiply(interestRateDec);

            // 4. Total Debt & EMI (100 days standard)
            BigDecimal totalDue = principal.add(totalInterest);
            BigDecimal dailyEmi = totalDue.divide(BigDecimal.valueOf(100), 0, RoundingMode.CEILING);

            // 5. Save the heavy reality to the database
            newLoan.setTotalAmountDue(totalDue);
            newLoan.setDailyEmiAmount(dailyEmi);
            // We need to add these fields to Loan.java next!
            // newLoan.setProcessingFee(processingFee);
            // newLoan.setDisbursedAmount(disbursedCash);

            newLoan.setCustomer(customer);
            newLoan.setAmountPaid(BigDecimal.ZERO);
            newLoan.setPenaltyCharges(BigDecimal.ZERO);
            newLoan.setStatus("ACTIVE");
            newLoan.setStartDate(LocalDate.now());

            Loan savedLoan = loanRepository.save(newLoan);

            // Return a rich response so the React UI can show the manager exactly how much cash to hand over
            return ResponseEntity.ok(savedLoan);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error issuing loan: " + e.getMessage());
        }
    }
}