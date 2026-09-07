package flashdeal_api.order.controller;

import flashdeal_api.order.entity.OrderStatus;
import flashdeal_api.order.exception.AppException;
import flashdeal_api.order.exception.ErrorCode;
import flashdeal_api.order.model.ApiResponse;
import flashdeal_api.order.model.dto.FlashSaleOrderRequest;
import flashdeal_api.order.model.dto.OrderResponse;
import flashdeal_api.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/flash-sales/orders")
@RequiredArgsConstructor
@Tag(name = "Flash Sale Orders", description = "APIs Săn Deal Chịu Tải Cao (50.000 req/s) và Quản Lý Đơn Hàng")
@SecurityRequirement(name = "BearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "SĂN DEAL FLASH SALE (Chịu tải cao 50.000 req/s, phản hồi < 5ms)")
    public ResponseEntity<ApiResponse<OrderResponse>> createFlashSaleOrder(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody FlashSaleOrderRequest request) {

        if (!(principal instanceof Long userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        OrderResponse response = orderService.createFlashSaleOrder(userId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.success("Săn deal thành công! Đơn hàng đang được xếp hàng tạo.", response));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Lấy danh sách đơn hàng đã săn của tôi")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal Object principal) {

        if (!(principal instanceof Long userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        List<OrderResponse> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{orderCode}")
    @Operation(summary = "Tra cứu chi tiết đơn hàng theo mã (orderCode)")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByCode(
            @PathVariable String orderCode) {
        OrderResponse order = orderService.getOrderByCode(orderCode);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PutMapping("/{orderCode}/cancel")
    @Operation(summary = "Hủy đơn hàng Flash Sale thủ công (và tự động hoàn kho Redis)")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable String orderCode,
            @AuthenticationPrincipal Object principal) {

        if (!(principal instanceof Long userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        OrderResponse response = orderService.cancelOrder(orderCode, userId);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng và hoàn kho thành công", response));
    }

    @PutMapping("/{orderCode}/pay")
    @Operation(summary = "Thanh toán đơn hàng (Chuyển trạng thái sang PAID)")
    public ResponseEntity<ApiResponse<OrderResponse>> payOrder(
            @PathVariable String orderCode,
            @AuthenticationPrincipal Object principal) {

        if (!(principal instanceof Long userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        OrderResponse response = orderService.payOrder(orderCode, userId);
        return ResponseEntity.ok(ApiResponse.success("Thanh toán đơn hàng thành công!", response));
    }

    @PostMapping("/cancel-expired")
    @Operation(summary = "Kích hoạt thủ công Động cơ quét & hủy đơn quá hạn 15 phút (Admin/Cron)")
    public ResponseEntity<ApiResponse<Integer>> cancelExpiredOrders() {
        int count = orderService.cancelExpiredOrders();
        return ResponseEntity.ok(ApiResponse.success("Đã quét và hủy thành công " + count + " đơn hàng quá hạn", count));
    }

    @GetMapping("/admin/all")
    @Operation(summary = "Lấy toàn bộ đơn hàng trong hệ thống (Dành cho Quản Trị Viên)")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrdersForAdmin(
            @RequestParam(value = "status", required = false) OrderStatus status) {
        List<OrderResponse> orders = orderService.getAllOrdersForAdmin(status);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PutMapping("/admin/{orderCode}/status")
    @Operation(summary = "Admin cập nhật trạng thái đơn hàng (PAID -> SHIPPING -> DELIVERED hoặc CANCELLED)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatusByAdmin(
            @PathVariable String orderCode,
            @RequestParam("status") OrderStatus status) {
        OrderResponse response = orderService.updateOrderStatusByAdmin(orderCode, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công!", response));
    }

    @PutMapping("/{orderCode}/confirm-delivered")
    @Operation(summary = "Khách hàng xác nhận đã nhận được hàng (Chuyển trạng thái sang DELIVERED)")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmDelivered(
            @PathVariable String orderCode,
            @AuthenticationPrincipal Object principal) {

        if (!(principal instanceof Long userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        OrderResponse response = orderService.confirmDeliveredByUser(orderCode, userId);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận đã nhận hàng thành công!", response));
    }
}
