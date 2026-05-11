package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByTenantId(Long tenantId);
    List<Route> findByBranchId(Long branchId);
}