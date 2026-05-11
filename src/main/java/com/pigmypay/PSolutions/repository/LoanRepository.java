package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    // Find all loans for a specific customer
    List<Loan> findByCustomerId(Long customerId);

    // Find only ACTIVE loans for a customer (so agents know what to collect)
    List<Loan> findByCustomerIdAndStatus(Long customerId, String status);

    List<Loan> findByStatus(String status);
}