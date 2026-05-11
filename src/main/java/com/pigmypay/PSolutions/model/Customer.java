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
    @Column(unique = true, nullable = false)
    private String accountNumber;
    private String name;
    private String phoneNumber;
    @Column(length = 500)
    private String residentialAddress;

    @Column(unique = true, length = 12)
    private String aadharNumber; // Indian UIDAI

    @Column(unique = true, length = 10)
    private String panNumber; // Indian Tax ID

    private java.time.LocalDate dateOfBirth;

    // e.g., "PENDING", "VERIFIED", "REJECTED"
    private String kycStatus = "PENDING";

    @ManyToOne // Links the customer to a specific agent
    @JoinColumn(name = "assigned_agent_id")
    private User assignedAgent;

    private BigDecimal currentBalance = BigDecimal.ZERO;
    private LocalDateTime createdAt = LocalDateTime.now();

    // Add to Customer.java
    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    // Guarantor Details
    @Column(length = 100)
    private String guarantorName;

    @Column(length = 15)
    private String guarantorPhoneNumber;

    @Column(length = 12)
    private String guarantorAadhar;


    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = java.time.LocalDateTime.now();
        this.updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = java.time.LocalDateTime.now();
    }

    // --- ROUTE LOGISTICS ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    // The physical order the agent should visit them (1, 2, 3...)
    private Integer routeSequence = 0;
}