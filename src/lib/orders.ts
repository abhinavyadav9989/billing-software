import supabase from '@/lib/supabase';

export type OrderItemInput = {
  product_id?: string;
  name: string;
  price: number;
  discount: number;
  quantity: number;
  total: number;
};

export type CreateOrderInput = {
  org_client_id: string;
  outlet_client_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_mobile?: string;
  total_amount: number;
  total_discount: number;
  final_amount: number;
  payment_method: 'cash' | 'upi';
  payment_status?: 'pending' | 'completed';
  cash_given?: number;
  change_amount?: number;
  items: OrderItemInput[];
};

export async function createOrderWithItemsSupabase(payload: CreateOrderInput): Promise<{ ok: boolean; orderId?: string; error?: string }>{
  const { data, error } = await supabase.rpc('create_order_with_items', { p_order: payload as any });
  if (error) return { ok: false, error: error.message };
  return { ok: true, orderId: data as string };
}


