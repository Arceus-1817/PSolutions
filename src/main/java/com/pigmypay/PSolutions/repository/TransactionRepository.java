package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Agent passbook — newest first
    List<Transaction> findByCustomerIdOrderByTransactionDateDesc(Long customerId);

    // Stats: all transactions for a tenant after a given time (for today's collections)
    List<Transaction> findByCustomerTenantIdAndTransactionDateAfter(
            Long tenantId, LocalDateTime after);

    // Stats: all transactions for a branch (via agent's branch)
    List<Transaction> findByAgentBranchIdAndTransactionDateAfter(
            Long branchId, LocalDateTime after);

    // Recent transactions across a tenant (for activity feed, newest first)
    List<Transaction> findByCustomerTenantIdOrderByTransactionDateDesc(Long tenantId);
}