package com.pigmypay.PSolutions.service;

import com.pigmypay.PSolutions.model.Loan;
import com.pigmypay.PSolutions.model.Holiday;
import com.pigmypay.PSolutions.repository.LoanRepository;
import com.pigmypay.PSolutions.repository.HolidayRepository;
import com.pigmypay.PSolutions.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LoanScheduler {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private HolidayRepository holidayRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    // A standard bounce charge in Indian Microfinance
    private final BigDecimal DAILY_BOUNCE_PENALTY = new BigDecimal("20.00");

    /**
     * CRON Expression: "0 1 0 * * ?" means run at 12:01 AM every day.
     * We run slightly after midnight to process "yesterday's" collections.
     */
    @Scheduled(cron = "0 1 0 * * ?")
    @Transactional
    public void runMidnightPenaltyCheck() {
        System.out.println("🌙 [THE BRAIN] Waking up at 12:01 AM to process loan arrears & NPA checks...");

        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfYesterday = yesterday.atStartOfDay();
        LocalDateTime endOfYesterday = yesterday.atTime(23, 59, 59);

        // Fetch all active loans
        List<Loan> activeLoans = loanRepository.findByStatus("ACTIVE");

        for (Loan loan : activeLoans) {
            Long tenantId = loan.getCustomer().getTenant().getId();

            // 1. HOLIDAY CHECK: Was yesterday a market holiday for this company?
            Optional<Holiday> holiday = holidayRepository.findByHolidayDateAndTenantId(yesterday, tenantId);
            if (holiday.isPresent()) {
                System.out.println("⏸️ Skipping Loan " + loan.getId() + " - Yesterday was a holiday: " + holiday.get().getDescription());
                continue; // Skip all penalties for this loan!
            }

            // 2. PAYMENT CHECK: How much did they physically pay yesterday?
            BigDecimal totalPaidYesterday = transactionRepository.sumAmountByLoanAndDateRange(
                    loan.getId(), startOfYesterday, endOfYesterday);

            if (totalPaidYesterday == null) {
                totalPaidYesterday = BigDecimal.ZERO;
            }

            // 3. THE FINTECH ARREARS ENGINE
            if (totalPaidYesterday.compareTo(loan.getDailyEmiAmount()) < 0) {
                // UNDERPAYMENT / MISSED PAYMENT

                // Calculate the shortfall (e.g., EMI is ₹110, paid ₹50 -> Shortfall is ₹60)
                BigDecimal shortfall = loan.getDailyEmiAmount().subtract(totalPaidYesterday);

                // Add shortfall to arrears balance (so the agent demands it today)
                loan.setArrearsBalance(loan.getArrearsBalance().add(shortfall));

                // Add flat ₹20 bounce penalty
                BigDecimal currentPenalties = loan.getPenaltyCharges() != null ? loan.getPenaltyCharges() : BigDecimal.ZERO;
                loan.setPenaltyCharges(currentPenalties.add(DAILY_BOUNCE_PENALTY));

                // Increment missed days for NPA tracking
                loan.setConsecutiveMissedDays(loan.getConsecutiveMissedDays() + 1);

                System.out.println("⚠️ Shortfall of ₹" + shortfall + " detected on Loan ID " + loan.getId() + ". Penalty applied.");

                // 4. NPA CHECK (90 Days RBI Rule)
                if (loan.getConsecutiveMissedDays() >= 90) {
                    loan.setStatus("NPA"); // Non-Performing Asset
                    System.out.println("🚨 ALERT: Loan " + loan.getId() + " hit 90 days of default. Shifted to NPA.");
                }

            } else {
                // OVERPAYMENT / ON-TIME
                // They paid perfectly (or extra)! Reset their consecutive missed days.
                loan.setConsecutiveMissedDays(0);
                System.out.println("✅ Loan ID " + loan.getId() + " is on track.");
            }
        }

        // 5. Save all changes to the database
        loanRepository.saveAll(activeLoans);
        System.out.println("🏁 [THE BRAIN] Midnight processing complete.");
    }
}