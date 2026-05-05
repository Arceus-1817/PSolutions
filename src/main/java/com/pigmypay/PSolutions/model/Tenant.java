// src/main/java/com/pigmypay/PSolutions/model/Tenant.java
package com.pigmypay.PSolutions.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String companyName;

    private String plan = "BASIC";        // BASIC, PRO, ENTERPRISE
    private String status = "ACTIVE";     // ACTIVE, SUSPENDED, TRIAL
    private LocalDateTime createdAt = LocalDateTime.now();
}