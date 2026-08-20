import {
  LayoutDashboard,
  Cake,
  FolderTree,
  ShoppingBag,
  Gift,
  Palette,
  Image,
  Newspaper,
  Star,
  Ticket,
  Users,
  Settings,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: Cake },
  { href: "/admin/danh-muc", label: "Danh mục", icon: FolderTree },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: ShoppingBag },
  { href: "/admin/banh-dat-rieng", label: "Bánh đặt riêng", icon: Gift },
  { href: "/admin/danh-gia", label: "Đánh giá", icon: Star },
  { href: "/admin/ma-giam-gia", label: "Mã giảm giá", icon: Ticket },
  { href: "/admin/banner", label: "Banner", icon: Image },
  { href: "/admin/bai-viet", label: "Bài viết", icon: Newspaper },
  { href: "/admin/khach-hang", label: "Khách hàng", icon: Users },
  { href: "/admin/giao-dien", label: "Giao diện", icon: Palette },
  { href: "/admin/cai-dat", label: "Cài đặt", icon: Settings },
];
