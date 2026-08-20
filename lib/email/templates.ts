import { formatMoney } from "@/lib/utils/format";

const WRAPPER_STYLE =
  "font-family: 'Be Vietnam Pro', Arial, sans-serif; color: #3A2A22; max-width: 560px; margin: 0 auto;";
const HEADING_STYLE = "color: #F7A8C4; font-size: 20px; margin: 0 0 16px;";
const TABLE_STYLE = "width: 100%; border-collapse: collapse; margin: 16px 0;";
const CELL_STYLE = "padding: 8px 0; border-bottom: 1px solid #F3E9E1; font-size: 14px;";

interface OrderItemLine {
  name: string;
  qty: number;
  lineTotal: number;
}

export function orderConfirmationEmail({
  brandName,
  code,
  items,
  total,
  paymentMethod,
  deliveryAt,
}: {
  brandName: string;
  code: string;
  items: OrderItemLine[];
  total: number;
  paymentMethod: "cod" | "bank_transfer";
  deliveryAt: string;
}): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="${CELL_STYLE}">${item.name} x${item.qty}</td><td style="${CELL_STYLE} text-align:right">${formatMoney(item.lineTotal)}</td></tr>`,
    )
    .join("");

  return `
    <div style="${WRAPPER_STYLE}">
      <h1 style="${HEADING_STYLE}">${brandName}</h1>
      <p>Cảm ơn bạn đã đặt hàng! Mã đơn của bạn là <strong>${code}</strong>.</p>
      <table style="${TABLE_STYLE}">${rows}</table>
      <p style="font-size: 16px; font-weight: 600;">Tổng cộng: ${formatMoney(total)}</p>
      <p>Phương thức thanh toán: ${paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản ngân hàng"}</p>
      <p>Thời gian nhận dự kiến: ${new Date(deliveryAt).toLocaleString("vi-VN")}</p>
      <p style="color: #6b5a4e; font-size: 13px;">Tiệm sẽ liên hệ xác nhận đơn trong thời gian sớm nhất.</p>
    </div>
  `;
}

export function newOrderNotificationEmail({
  code,
  customerName,
  phone,
  total,
  paymentMethod,
}: {
  code: string;
  customerName: string;
  phone: string;
  total: number;
  paymentMethod: "cod" | "bank_transfer";
}): string {
  return `
    <div style="${WRAPPER_STYLE}">
      <h1 style="${HEADING_STYLE}">Đơn hàng mới: ${code}</h1>
      <p>Khách hàng: ${customerName} — ${phone}</p>
      <p>Tổng: ${formatMoney(total)} (${paymentMethod === "cod" ? "COD" : "Chuyển khoản"})</p>
      <p>Xem chi tiết trong trang quản trị.</p>
    </div>
  `;
}

const ORDER_STATUS_VI: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  baking: "Đang làm bánh",
  delivering: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ",
};

export function orderStatusUpdateEmail({
  brandName,
  code,
  status,
  note,
}: {
  brandName: string;
  code: string;
  status: string;
  note?: string;
}): string {
  return `
    <div style="${WRAPPER_STYLE}">
      <h1 style="${HEADING_STYLE}">${brandName}</h1>
      <p>Đơn hàng <strong>${code}</strong> của bạn vừa được cập nhật trạng thái:</p>
      <p style="font-size: 18px; font-weight: 600;">${ORDER_STATUS_VI[status] ?? status}</p>
      ${note ? `<p>${note}</p>` : ""}
      <p style="color: #6b5a4e; font-size: 13px;">Cảm ơn bạn đã tin tưởng ${brandName}.</p>
    </div>
  `;
}

export function customCakeQuoteEmail({
  brandName,
  quotedPrice,
  adminReply,
}: {
  brandName: string;
  quotedPrice: number;
  adminReply?: string | null;
}): string {
  return `
    <div style="${WRAPPER_STYLE}">
      <h1 style="${HEADING_STYLE}">${brandName}</h1>
      <p>Cảm ơn bạn đã gửi yêu cầu đặt bánh riêng. Chúng tôi xin báo giá:</p>
      <p style="font-size: 20px; font-weight: 700; color: #7B4B2A;">${formatMoney(quotedPrice)}</p>
      ${adminReply ? `<p>${adminReply}</p>` : ""}
      <p style="color: #6b5a4e; font-size: 13px;">Vui lòng liên hệ lại để xác nhận đặt bánh.</p>
    </div>
  `;
}

export function customCakeRequestEmail({
  customerName,
  phone,
  size,
  needAt,
}: {
  customerName: string;
  phone: string;
  size: string;
  needAt: string;
}): string {
  return `
    <div style="${WRAPPER_STYLE}">
      <h1 style="${HEADING_STYLE}">Yêu cầu đặt bánh riêng mới</h1>
      <p>Khách hàng: ${customerName} — ${phone}</p>
      <p>Kích thước: ${size}</p>
      <p>Ngày cần: ${new Date(needAt).toLocaleString("vi-VN")}</p>
      <p>Xem chi tiết và báo giá trong trang quản trị.</p>
    </div>
  `;
}
