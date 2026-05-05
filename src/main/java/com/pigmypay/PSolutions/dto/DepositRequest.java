package com.pigmypay.PSolutions.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DepositRequest {
    private Long customerId;
    private Long agentId;
    private BigDecimal amount;
    private String paymentMode; // "CASH" or "UPI"
}