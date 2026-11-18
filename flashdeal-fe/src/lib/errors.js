/* Customer-facing wording for the error codes the services return. */
const MESSAGES = {
  1004: 'Bạn cần đăng nhập để tiếp tục.',
  1005: 'Tài khoản của bạn không có quyền thực hiện thao tác này.',
  1006: 'Email hoặc mật khẩu chưa đúng.',
  1007: 'Tài khoản đang bị khóa hoặc không có quyền thực hiện thao tác này.',
  1008: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  1009: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  1011: 'Email chưa đúng định dạng.',
  1012: 'Email này đã có tài khoản. Hãy đăng nhập hoặc dùng email khác.',
  1014: 'Mật khẩu cần ít nhất 6 ký tự.',
  1018: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  1090: 'Đơn của bạn đang được xử lý. Vui lòng chờ vài giây rồi xem lại trong mục đơn hàng.',
  3001: 'Chương trình flash sale này không còn tồn tại.',
  3002: 'Chương trình flash sale chưa mở hoặc đã kết thúc.',
  3003: 'Sản phẩm không thuộc chương trình flash sale này.',
  3004: 'Sản phẩm đã hết suất flash sale.',
  3005: 'Bạn đã mua sản phẩm này trong chương trình. Mỗi tài khoản được mua một suất.',
  3006: 'Không tìm thấy đơn hàng.',
  3007: 'Đơn hàng này không thể hủy nữa.',
  3011: 'Chỉ xác nhận đã nhận khi đơn đang được giao.',
};

export function errorMessage(err, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.') {
  if (!err) return fallback;
  if (err.status === 0) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
  return MESSAGES[err.code] || err.message || fallback;
}
