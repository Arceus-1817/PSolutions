package com.pigmypay.PSolutions.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Links the loan to a specific customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private BigDecimal principalAmount; // e.g., ₹50,000

    @Column(nullable = false)
    private Double interestRate; // e.g., 12.5%

    @Column(nullable = false)
    private BigDecimal totalAmountDue; // Principal + Interest

    @Column(nullable = false)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal dailyEmiAmount; // How much the agent collects daily

    private LocalDate startDate;
    private LocalDate endDate;

    // e.g., "DAILY", "WEEKLY", "MONTHLY"
    @Column(nullable = false)
    private String emiFrequency = "DAILY";

    // Tracks late fees/bounce charges added by the manager
    @Column(nullable = false)
    private BigDecimal penaltyCharges = BigDecimal.ZERO;

    // ACTIVE, CLOSED, DEFAULTED
    private String status = "ACTIVE";

    @Column(updatable = false)
    private java.time.LocalDateTime createdAt;

    private java.time.LocalDateTime updatedAt;

    // --- REAL CREDIT MECHANICS ---

    // The fee deducted upfront before handing cash to the customer (e.g., 2% to 5%)
    @Column(nullable = false)
    private BigDecimal processingFeeAmount = BigDecimal.ZERO;

    // Tracks partial payments. If daily EMI is ₹110 and they pay ₹50, arrears increases by ₹60.
    @Column(nullable = false)
    private BigDecimal arrearsBalance = BigDecimal.ZERO;

    // For tracking Non-Performing Assets (NPA) under RBI guidelines
    @Column(nullable = false)
    private Integer consecutiveMissedDays = 0;

    @PrePersist
    protected void onCreate() {
        this.createdAt = java.time.LocalDateTime.now();
        this.updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = java.time.LocalDateTime.now();
    }
}