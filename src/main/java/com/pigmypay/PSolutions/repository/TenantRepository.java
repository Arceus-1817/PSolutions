package com.pigmypay.PSolutions.repository;
import com.pigmypay.PSolutions.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TenantRepository extends JpaRepository<Tenant, Long> {}