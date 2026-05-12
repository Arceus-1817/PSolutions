package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // Agent's own customers
    List<Customer> findByAssignedAgentId(Long agentId);

    // Tenant-scoped (admin view)
    List<Customer> findByAssignedAgentIdAndTenantId(Long agentId, Long tenantId);

    // All customers in a tenant (admin dashboard)
    List<Customer> findByTenantId(Long tenantId);

    // All customers in a branch (manager portal)
    List<Customer> findByAssignedAgentBranchId(Long branchId);

    List<Customer> findByRouteIdOrderByRouteSequenceAsc(Long id);
}