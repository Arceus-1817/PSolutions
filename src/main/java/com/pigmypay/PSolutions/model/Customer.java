package com.pigmypay.PSolutions.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String accountNumber;
    private String name;
    private String phoneNumber;

    @ManyToOne // Links the customer to a specific agent
    @JoinColumn(name = "assigned_agent_id")
    private User assignedAgent;

    private BigDecimal currentBalance = BigDecimal.ZERO;
    private LocalDateTime createdAt = LocalDateTime.now();
}