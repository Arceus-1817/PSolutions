package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // Allows the app to fetch all customers assigned to a specific field agent
    List<Customer> findByAssignedAgentId(Long agentId);
}
