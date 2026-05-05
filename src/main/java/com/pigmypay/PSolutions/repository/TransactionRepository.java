package com.pigmypay.PSolutions.repository;


import com.pigmypay.PSolutions.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Fetch a customer's passbook (transaction history)
    List<Transaction> findByCustomerIdOrderByTransactionDateDesc(Long customerId);
}
