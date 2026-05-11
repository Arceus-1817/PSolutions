package com.pigmypay.PSolutions.service;

import com.pigmypay.PSolutions.model.Loan;
import com.pigmypay.PSolutions.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class LoanScheduler {

    @Autowired
    private LoanRepository loanRepository;

    // A standard bounce charge in Indian Microfinance
    private final BigDecimal DAILY_BOUNCE_PENALTY = new BigDecimal("20.00");

    /**
     * CRON Expression: "0 59 23 * * ?" means run at 23:59:00 (11:59 PM) every day.
     * @Transactional ensures that if the database crashes halfway through,
     * it rolls back so no one gets charged twice.
     */
    @Scheduled(cron = "0 59 23 * * ?")
    @Transactional
    public void runMidnightPenaltyCheck() {
        System.out.println("🌙 [PIGMYPAY CRON] Waking up to process midnight loan checks...");

        List<Loan> activeLoans = loanRepository.findByStatus("ACTIVE");
        LocalDate today = LocalDate.now();

        for (Loan loan : activeLoans) {
            // 1. Calculate how many days have passed since the loan started
            long daysActive = ChronoUnit.DAYS.between(loan.getStartDate(), today);

            // Ignore loans issued exactly today (Day 0)
            if (daysActive <= 0) continue;

            // 2. What SHOULD they have paid by tonight? (Target)
            BigDecimal expectedPaidAmount = loan.getDailyEmiAmount().multiply(BigDecimal.valueOf(daysActive));

            // 3. What HAVE they actually paid? (Reality)
            BigDecimal actualPaidAmount = loan.getAmountPaid();

            // 4. The FinTech Rules Engine
            if (actualPaidAmount.compareTo(expectedPaidAmount) < 0) {
                // UNDERPAYMENT / MISSED PAYMENT:
                // Their reality is lower than the target. They missed an EMI or paid short.

                BigDecimal currentPenalties = loan.getPenaltyCharges() != null ? loan.getPenaltyCharges() : BigDecimal.ZERO;
                loan.setPenaltyCharges(currentPenalties.add(DAILY_BOUNCE_PENALTY));

                // Add the penalty to their Total Due as well, so the Agent knows to collect it
                loan.setTotalAmountDue(loan.getTotalAmountDue().add(DAILY_BOUNCE_PENALTY));

                System.out.println("⚠️ Applied ₹20 penalty to Loan ID " + loan.getId() + " (Shortfall detected)");

            } else {
                // OVERPAYMENT / ON-TIME:
                // actualPaidAmount >= expectedPaidAmount.
                // Because of this math, if they paid ₹500 extra yesterday, they are safe from penalties today!
                System.out.println("✅ Loan ID " + loan.getId() + " is on track or paid in advance.");
            }
        }

        // 5. Save all changes to the database
        loanRepository.saveAll(activeLoans);
        System.out.println("🏁 [PIGMYPAY CRON] Midnight processing complete.");
    }
}