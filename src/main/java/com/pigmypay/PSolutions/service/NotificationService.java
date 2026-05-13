package com.pigmypay.PSolutions.service;

import com.pigmypay.PSolutions.model.Customer;
import com.pigmypay.PSolutions.model.Loan;
import com.pigmypay.PSolutions.model.Transaction;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class NotificationService {

    @Async // This runs in the background so the Agent App doesn't freeze!
    public void sendWhatsAppReceipt(Transaction transaction) {
        Customer customer = transaction.getCustomer();
        String phone = customer.getPhoneNumber();

        if (phone == null || phone.isEmpty()) {
            System.out.println("Skipping WhatsApp: No phone number for " + customer.getName());
            return;
        }

        String message;

        if (transaction.getTransactionCategory().equals("LOAN_REPAYMENT")) {
            Loan loan = transaction.getAssociatedLoan();
            BigDecimal remainingBalance = loan.getTotalAmountDue().subtract(loan.getAmountPaid());

            message = String.format(
                    "🟢 *PigmyPay Loan Receipt*\n\n" +
                            "Hello %s,\n" +
                            "We have received your EMI payment of *₹%s*.\n\n" +
                            "📋 *A/C:* %s\n" +
                            "💰 *Total Paid:* ₹%s\n" +
                            "📉 *Remaining Balance:* ₹%s\n\n" +
                            "Collected by Agent: %s\n" +
                            "Thank you for using PigmyPay!",
                    customer.getName(),
                    transaction.getAmount(),
                    customer.getAccountNumber(),
                    loan.getAmountPaid(),
                    remainingBalance,
                    transaction.getAgent().getName()
            );
        } else {
            message = String.format(
                    "🟢 *PigmyPay Savings Receipt*\n\n" +
                            "Hello %s,\n" +
                            "We have received your deposit of *₹%s*.\n\n" +
                            "📋 *A/C:* %s\n" +
                            "🏦 *New Balance:* ₹%s\n\n" +
                            "Collected by Agent: %s\n" +
                            "Thank you for using PigmyPay!",
                    customer.getName(),
                    transaction.getAmount(),
                    customer.getAccountNumber(),
                    customer.getCurrentBalance(),
                    transaction.getAgent().getName()
            );
        }

        // 🚨 TODO: Insert actual Twilio / Meta WhatsApp API code here.
        // For now, we will print it to the server console to prove it works instantly.
        System.out.println("=========================================");
        System.out.println("🚀 FIRING WHATSAPP TO: " + phone);
        System.out.println(message);
        System.out.println("=========================================");
    }
}