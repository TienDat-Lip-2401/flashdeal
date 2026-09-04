package flashdeal_api.payment.service;

import flashdeal_api.payment.dto.PaymentCallbackResponse;
import flashdeal_api.payment.dto.VNPayCreatePaymentRequest;
import flashdeal_api.payment.dto.VNPayPaymentResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface PaymentService {

    VNPayPaymentResponse createVNPayPaymentUrl(VNPayCreatePaymentRequest request, HttpServletRequest servletRequest);

    PaymentCallbackResponse processVNPayCallback(Map<String, String> allParams);

    PaymentCallbackResponse simulateSuccessPayment(String orderCode, String email);
}
