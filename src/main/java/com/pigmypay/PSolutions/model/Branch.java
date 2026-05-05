// src/main/java/com/pigmypay/PSolutions/model/Branch.java
package com.pigmypay.PSolutions.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "branches")
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;            // e.g. "Shivaji Nagar Branch"
    private String address;
    private String city;

    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;
}