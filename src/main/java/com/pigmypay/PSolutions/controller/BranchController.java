package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.Branch;
import com.pigmypay.PSolutions.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/branches")
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;

    // GET /api/branches/tenant/{tenantId}  — list all branches for a company
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<?> getBranchesByTenant(@PathVariable Long tenantId) {
        try {
            List<Branch> branches = branchRepository.findByTenantId(tenantId);
            return ResponseEntity.ok(branches);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // POST /api/branches  — create a new branch
    @PostMapping
    public ResponseEntity<?> createBranch(@RequestBody Branch branch) {
        try {
            Branch saved = branchRepository.save(branch);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // DELETE /api/branches/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBranch(@PathVariable Long id) {
        try {
            branchRepository.deleteById(id);
            return ResponseEntity.ok("Branch deleted.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}