package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    Optional<Holiday> findByHolidayDateAndTenantId(LocalDate holidayDate, Long tenantId);
    List<Holiday> findByTenantId(Long tenantId);
}