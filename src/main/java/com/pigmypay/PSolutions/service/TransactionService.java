package com.pigmypay.PSolutions.service;

import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.model.Transaction;
import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.CustomerRepository;
import com.pigmypay.PSolutions.repository.TransactionRepository;
import com.pigmypay.PSolutions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    // @Transactional ensures that if updating the balance fails, the transaction isn't saved either (prevents data mismatch)
    @Transactional
    public Transaction recordDeposit(Long customerId, Long agentId, BigDecimal amount, String paymentMode) {

        // 1. Verify that the customer and agent actually exist in the database
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        // 2. Update the Customer's current balance
        customer.setCurrentBalance(customer.getCurrentBalance().add(amount));
        customerRepository.save(customer);

        // 3. Create the transaction record
        Transaction transaction = new Transaction();
        transaction.setCustomer(customer);
        transaction.setAgent(agent);
        transaction.setAmount(amount);
        transaction.setTransactionType("DEPOSIT");
        transaction.setPaymentMode(paymentMode);

        // 4. Save and return the transaction
        return transactionRepository.save(transaction);
    }
}