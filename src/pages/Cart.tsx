import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Minus, ShoppingCart, Scan, CreditCard, IndianRupee, Trash2, QrCode } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Product, CartItem, Order } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { createOrderWithItemsSupabase } from '@/lib/orders';
import { Input as TextInput } from '@/components/ui/input';

const Cart = () => {
  const [products] = useLocalStorage<Product[]>('pos_products', []);
  const [orders, setOrders] = useLocalStorage<Order[]>('pos_orders', []);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerDetails, setCustomerDetails] = useState({ name: '', mobile: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  // TEMP for testing: org/outlet ids to target
  const [orgClientId, setOrgClientId] = useState('');
  const [outletClientId, setOutletClientId] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({ title: "Error", description: "Insufficient stock", variant: "destructive" });
        return;
      }
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      if (product.stock <= 0) {
        toast({ title: "Error", description: "Product out of stock", variant: "destructive" });
        return;
      }
      
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        price: product.price,
        discount: product.discount,
        quantity: 1,
        total: product.price * (1 - product.discount / 100)
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const item = cartItems.find(item => item.id === itemId);
    const product = products.find(p => p.id === item?.productId);
    
    if (product && newQuantity > product.stock) {
      toast({ title: "Error", description: "Insufficient stock", variant: "destructive" });
      return;
    }

    setCartItems(cartItems.map(item => {
      if (item.id === itemId) {
        const total = item.price * newQuantity * (1 - item.discount / 100);
        return { ...item, quantity: newQuantity, total };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomerDetails({ name: '', mobile: '' });
    setCashGiven('');
  };

  const calculateTotals = () => {
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity * item.discount / 100), 0);
    const finalAmount = totalAmount - totalDiscount;
    
    return { totalAmount, totalDiscount, finalAmount };
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({ title: "Error", description: "Cart is empty", variant: "destructive" });
      return;
    }
    setIsCheckoutDialogOpen(true);
  };

  const confirmOrder = async () => {
    const { totalAmount, totalDiscount, finalAmount } = calculateTotals();
    
    if (paymentMethod === 'cash') {
      const cash = parseFloat(cashGiven);
      if (isNaN(cash) || cash < finalAmount) {
        toast({ title: "Error", description: "Insufficient cash amount", variant: "destructive" });
        return;
      }
    }
    if (!orgClientId || !outletClientId) {
      toast({ title: 'Missing IDs', description: 'Please provide Org and Outlet IDs to place order (temporary).', variant: 'destructive' });
      return;
    }

    const payload = {
      org_client_id: orgClientId,
      outlet_client_id: outletClientId,
      customer_name: customerDetails.name || undefined,
      customer_mobile: customerDetails.mobile || undefined,
      total_amount: totalAmount,
      total_discount: totalDiscount,
      final_amount: finalAmount,
      payment_method: paymentMethod,
      payment_status: 'completed' as const,
      cash_given: paymentMethod === 'cash' ? parseFloat(cashGiven) : undefined,
      change_amount: paymentMethod === 'cash' ? parseFloat(cashGiven) - finalAmount : undefined,
      items: cartItems.map(ci => ({
        product_id: ci.productId,
        name: ci.name,
        price: ci.price,
        discount: ci.discount,
        quantity: ci.quantity,
        total: ci.total,
      }))
    };

    const res = await createOrderWithItemsSupabase(payload);
    if (!res.ok) {
      toast({ title: 'Checkout failed', description: res.error, variant: 'destructive' });
      return;
    }

    // Local UI cleanup
    clearCart();
    setIsCheckoutDialogOpen(false);
    toast({ title: 'Success', description: `Order completed! Order ID: ${res.orderId}` });
  };

  const { totalAmount, totalDiscount, finalAmount } = calculateTotals();
  const changeAmount = paymentMethod === 'cash' && cashGiven ? parseFloat(cashGiven) - finalAmount : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* TEMP inputs for Org/Outlet IDs to test Supabase checkout */}
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
          <TextInput placeholder="Org Client ID" value={orgClientId} onChange={(e) => setOrgClientId(e.target.value)} className="glass" />
          <TextInput placeholder="Outlet Client ID" value={outletClientId} onChange={(e) => setOutletClientId(e.target.value)} className="glass" />
        </div>
      </div>
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scan className="h-5 w-5 mr-2 text-primary" />
              Product Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="glass rounded-lg p-3 hover:neon-primary transition-all cursor-pointer" onClick={() => addToCart(product)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm">{product.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">₹{product.price}</Badge>
                          <Badge variant={product.stock <= product.stockLevel ? "destructive" : "secondary"} className="text-xs">
                            {product.stock}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" className="ml-2 bg-gradient-primary neon-primary text-primary-foreground">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart & Checkout */}
      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                Cart ({cartItems.length})
              </CardTitle>
              {cartItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCart} className="glass text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="glass rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-foreground text-sm">{item.name}</h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="h-6 w-6 p-0 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 p-0 glass"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 p-0 glass"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{item.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {cartItems.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-accent">-₹{totalDiscount.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={handleCheckout} className="w-full mt-4 bg-gradient-primary neon-primary hover:opacity-90 text-primary-foreground">
                <CreditCard className="h-4 w-4 mr-2" />
                Checkout
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
            <DialogDescription>Review order details and process payment</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Customer Details (Optional)</Label>
              <Input
                placeholder="Customer name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                className="glass"
              />
              <Input
                placeholder="Mobile number"
                value={customerDetails.mobile}
                onChange={(e) => setCustomerDetails({ ...customerDetails, mobile: e.target.value })}
                className="glass"
              />
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <Tabs value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <TabsList className="grid w-full grid-cols-2 glass">
                  <TabsTrigger value="cash">Cash</TabsTrigger>
                  <TabsTrigger value="upi">UPI</TabsTrigger>
                </TabsList>
                <TabsContent value="cash" className="space-y-3">
                  <Label>Cash Received</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter cash amount"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="glass"
                  />
                  {cashGiven && (
                    <div className="p-3 glass rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Change to return:</span>
                        <span className={changeAmount >= 0 ? "text-accent" : "text-destructive"}>
                          ₹{Math.max(0, changeAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="upi">
                  <div className="text-center p-6 glass rounded-lg">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Show QR code to customer</p>
                    <p className="font-semibold text-lg">₹{finalAmount.toFixed(2)}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="border-t border-border pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)} className="flex-1 glass">
                Cancel
              </Button>
              <Button onClick={confirmOrder} className="flex-1 bg-gradient-primary neon-primary hover:opacity-90 text-primary-foreground">
                Complete Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;