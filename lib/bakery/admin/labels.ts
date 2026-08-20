/** Vietnamese display labels for every status enum used in the admin UI. */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  baking: "Đang làm bánh",
  delivering: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ",
};

export const ORDER_STATUS_BADGE_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  baking: "default",
  delivering: "default",
  completed: "outline",
  cancelled: "destructive",
};

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

export const COUPON_STATUS_LABELS: Record<string, string> = {
  active: "Đang hoạt động",
  expired: "Hết hạn",
  disabled: "Đã tắt",
};

export const CUSTOM_CAKE_STATUS_LABELS: Record<string, string> = {
  new: "Mới",
  quoted: "Đã báo giá",
  accepted: "Khách đồng ý",
  rejected: "Khách từ chối",
};

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  active: "Đã xuất bản",
  draft: "Nháp",
  archived: "Lưu trữ",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};
