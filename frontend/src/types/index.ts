// ─────────────── Auth ───────────────
export type UserRole = "admin" | "vendor" | "customer";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  email_verified: boolean;
  shop?: Shop;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─────────────── Shop ───────────────
export type ShopStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Shop {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  rating: number;
  review_count: number;
  status: ShopStatus;
  rejection_reason?: string;
  created_at: string;
}

// ─────────────── Category ───────────────
export interface Category {
  id: number;
  parent_id?: number;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
  children?: Category[];
}

// ─────────────── Product ───────────────
export type ProductStatus = "draft" | "pending" | "published" | "rejected";

export interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  attributes: Record<string, string>;
  attribute_label: string;
  price?: number;
  discount_price?: number;
  effective_price: number;
  stock_quantity: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  shop_id: number;
  category_id: number;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  discount_price?: number;
  effective_price: number;
  stock_quantity: number;
  rating: number;
  review_count: number;
  status: ProductStatus;
  is_featured: boolean;
  is_in_stock: boolean;
  sold_count: number;
  shop?: Shop;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
}

// ─────────────── Commission ───────────────
export interface ShopCommission {
  id: number;
  shop_id: number;
  year: number;
  month: number;
  cycle?: number;
  period_start?: string;
  period_end?: string;
  gross_revenue: number;
  commission_rate: number;
  commission_amount: number;
  status: "pending" | "paid";
  paid_at?: string;
  invoice_sent_at?: string;
  invoice_number?: string;
  shop?: Shop;
  created_at: string;
}

// ─────────────── Cart ───────────────
export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: number;
  user_id: number;
  total: number;
  item_count: number;
  items: CartItem[];
}

// ─────────────── Order ───────────────
export type OrderStatus =
  | "pending" | "confirmed" | "processing"
  | "shipped" | "delivered" | "cancelled" | "refunded";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number;
  variant_id?: number;
  product_name: string;
  variant_info?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  shop_id: number;
  address_id?: number;
  coupon_id?: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_fee: number;
  total: number;
  status: OrderStatus;
  tracking_number?: string;
  notes?: string;
  shop?: Shop;
  address?: Address;
  items: OrderItem[];
  payment?: Payment;
  created_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
}

// ─────────────── Payment ───────────────
export interface Payment {
  id: number;
  order_id: number;
  gateway: string;
  transaction_id?: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  metadata?: Record<string, unknown>;
}

// ─────────────── Address ───────────────
export interface Address {
  id: number;
  user_id: number;
  label: string;
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  full_address?: string;
}

// ─────────────── Review ───────────────
export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  order_id: number;
  rating: number;
  comment?: string;
  images?: string[];
  vendor_reply?: string;
  vendor_replied_at?: string;
  user?: User;
  created_at: string;
}

// ─────────────── Coupon ───────────────
export interface Coupon {
  id: number;
  shop_id?: number;
  code: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_amount: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
}

// ─────────────── Notification ───────────────
export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

// ─────────────── Checkout ───────────────
export interface CheckoutSummary {
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  discount: number;
  total: number;
  coupon?: Coupon;
}

// ─────────────── Pagination ───────────────
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ─────────────── API ───────────────
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
