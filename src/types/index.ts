export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  discount: number;
  stock: number;
  stockLevel: number; // Minimum stock alert level
  category?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  discount: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  items: CartItem[];
  totalAmount: number;
  totalDiscount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'upi';
  paymentStatus: 'pending' | 'completed';
  cashGiven?: number;
  changeAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  todaySales: number;
  profit: number;
  lowStockItems: Product[];
  fastStockoutProducts: (Product & { totalSold: number })[];
  lessSoldProducts: (Product & { totalSold: number })[];
}

export interface StoreProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  logo?: string;
}