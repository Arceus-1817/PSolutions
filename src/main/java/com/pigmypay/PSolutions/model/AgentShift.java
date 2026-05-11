package com.pigmypay.PSolutions.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "agent_shifts")
public class AgentShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The route being walked
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    // The agent walking the route
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private User agent;

    @Column(nullable = false)
    private LocalDate startDate;

    // If null, it means this is their permanent, ongoing assignment.
    // If it has a date, it means they are just covering the route temporarily.
    private LocalDate endDate;

    // e.g., "ACTIVE", "COMPLETED", "CANCELLED"
    private String status = "ACTIVE";
}