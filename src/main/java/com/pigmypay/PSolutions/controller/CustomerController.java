package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.pigmypay.PSolutions.model.User;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    // This listens for GET requests sent to /api/customers/agent/{id}
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getCustomersForAgent(@PathVariable Long agentId) {
        try {
            // We use the custom repository method we wrote in Step 5
            List<Customer> customers = customerRepository.findByAssignedAgentId(agentId);

            if (customers.isEmpty()) {
                return ResponseEntity.ok("No customers found for this agent.");
            }

            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching customers: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> addNewCustomer(@RequestBody Customer newCustomer) {
        try {
            // We deleted the hardcoded agent.setId(1L) completely!
            // Spring Boot automatically reads the dynamic ID from the new React payload.

            Customer savedCustomer = customerRepository.save(newCustomer);
            return ResponseEntity.ok(savedCustomer);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving customer: " + e.getMessage());
        }

    }
}