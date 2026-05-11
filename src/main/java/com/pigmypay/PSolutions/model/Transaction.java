package com.pigmypay.PSolutions.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "agent_id")
    private User agent;

    private BigDecimal amount;

    private String transactionType; // DEPOSIT or WITHDRAWAL
    private String paymentMode;     // CASH or UPI

    private LocalDateTime transactionDate = LocalDateTime.now();
    private String syncStatus = "SYNCED";
    // e.g., "SAVINGS_DEPOSIT", "LOAN_REPAYMENT", "LOAN_DISBURSEMENT"
    @Column(nullable = false)
    private String transactionCategory = "SAVINGS_DEPOSIT";

    // If this transaction is paying off a loan, link it here. If it's just savings, leave it null.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = true)
    private Loan associatedLoan;

    // e.g., "UNSETTLED" (in agent's pocket) or "SETTLED" (in branch safe)
    @Column(nullable = false)
    private String settlementStatus = "UNSETTLED";
    private Boolean isReversed = false;

    // Add to Transaction.java
    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;
}
