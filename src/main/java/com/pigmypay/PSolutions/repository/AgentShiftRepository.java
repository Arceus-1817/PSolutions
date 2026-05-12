package com.pigmypay.PSolutions.repository;

import com.pigmypay.PSolutions.model.AgentShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface AgentShiftRepository extends JpaRepository<AgentShift, Long> {
    List<AgentShift> findByAgentIdAndStatus(Long agentId, String status);
}
