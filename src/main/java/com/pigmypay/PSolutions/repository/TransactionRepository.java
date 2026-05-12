package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.associatedLoan.id = :loanId AND t.transactionDate >= :startDate AND t.transactionDate <= :endDate AND t.isReversed = false")
    java.math.BigDecimal sumAmountByLoanAndDateRange(
            @org.springframework.data.repository.query.Param("loanId") Long loanId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    List<Transaction> findByAgentIdAndSettlementStatus(Long agentId, String unsettled);
}