package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.Role;
import com.pigmypay.PSolutions.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // Custom method to find an agent by their phone number for login
    Optional<User> findByPhoneNumber(String phoneNumber);

    Optional<User> findByEmail(String email);

    // For Company Admins: Get everyone in the company EXCEPT the System Admin
    List<User> findByTenantIdAndRoleNot(Long tenantId, Role role);

    // For Branch Managers: Get only users assigned to their specific branch
    List<User> findByBranchIdAndRoleNot(Long branchId, Role role);

    List<User> findByTenantId(Long tenantId);
    List<User> findByBranchId(Long branchId);

}
