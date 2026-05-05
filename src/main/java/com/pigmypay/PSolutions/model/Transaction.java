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
    private Boolean isReversed = false;
}
