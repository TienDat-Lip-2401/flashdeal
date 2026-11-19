package flashdeal_api.payment.service;

import flashdeal_api.payment.client.OrderClient.OrderInfo;
import flashdeal_api.payment.dto.PaymentCallbackResponse;
import flashdeal_api.payment.dto.VNPayCreatePaymentRequest;
import flashdeal_api.payment.dto.VNPayPaymentResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface PaymentService {

    /** order: don da xac minh thuoc ve nguoi goi va dang PENDING; so tien lay tu order, khong lay tu client. */
    VNPayPaymentResponse createVNPayPaymentUrl(VNPayCreatePaymentRequest request, OrderInfo order, String email,
                                               HttpServletRequest servletRequest);

    PaymentCallbackResponse processVNPayCallback(Map<String, String> allParams);

    PaymentCallbackResponse simulateSuccessPayment(OrderInfo order, String email);

    PaymentCallbackResponse simulateFailPayment(OrderInfo order, String email, String reason);
}
