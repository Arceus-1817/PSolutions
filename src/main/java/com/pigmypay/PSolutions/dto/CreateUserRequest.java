// src/main/java/com/pigmypay/PSolutions/dto/CreateUserRequest.java
package com.pigmypay.PSolutions.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String name;
    private String email;
    private String phoneNumber;
    private String password;
    private String role;          // "AGENT", "MANAGER"
    private Long tenantId;
    private Long branchId;        // nullable for ADMIN role
}