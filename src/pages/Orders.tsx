import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, FileText, Download, Printer, Eye, CreditCard, IndianRupee, Calendar } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Order } from '@/types';
import { format } from 'date-fns';

const Orders = () => {
  const [orders] = useLocalStorage<Order[]>('pos_orders', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerMobile?.includes(searchTerm);
    
    const matchesPayment = filterPayment === 'all' || order.paymentMethod === filterPayment;
    
    return matchesSearch && matchesPayment;
  });

  const sortedOrders = filteredOrders.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const generateBill = (order: Order) => {
    // Simple bill generation - in real app, this would generate PDF
    const billContent = `
AURA BILL POS
-----------------
Order ID: ${order.id}
Date: ${format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
Customer: ${order.customerName || 'Walk-in'}
${order.customerMobile ? `Mobile: ${order.customerMobile}` : ''}

ITEMS:
${order.items.map(item => 
  `${item.name} x${item.quantity} @ ₹${item.price} = ₹${item.total.toFixed(2)}`
).join('\n')}

-----------------
Subtotal: ₹${order.totalAmount.toFixed(2)}
Discount: ₹${order.totalDiscount.toFixed(2)}
TOTAL: ₹${order.finalAmount.toFixed(2)}

Payment: ${order.paymentMethod.toUpperCase()}
${order.cashGiven ? `Cash Given: ₹${order.cashGiven.toFixed(2)}` : ''}
${order.changeAmount ? `Change: ₹${order.changeAmount.toFixed(2)}` : ''}

Thank you for your business!
    `;

    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${order.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printBill = (order: Order) => {
    // Simple print functionality - in real app, this would interface with thermal printer
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Order History</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass w-64"
            />
          </div>
          <Select value={filterPayment} onValueChange={setFilterPayment}>
            <SelectTrigger className="w-32 glass">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {orders.length === 0 ? 'No orders have been placed yet' : 'Try adjusting your search or filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedOrders.map((order) => (
                <div key={order.id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-primary neon-primary">
                        {order.paymentMethod === 'cash' ? (
                          <IndianRupee className="h-5 w-5 text-primary-foreground" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-foreground">Order #{order.id.slice(-6)}</h4>
                          <Badge 
                            variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {order.paymentStatus}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {order.paymentMethod.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                            </span>
                            {order.customerName && (
                              <span>Customer: {order.customerName}</span>
                            )}
                            <span className="font-medium">₹{order.finalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                            className="glass hover:neon-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Details - #{order.id.slice(-6)}</DialogTitle>
                            <DialogDescription>
                              {format(new Date(order.createdAt), 'PPPP')}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-4">
                              {/* Customer Info */}
                              {(selectedOrder.customerName || selectedOrder.customerMobile) && (
                                <div className="glass rounded-lg p-4">
                                  <h4 className="font-medium mb-2">Customer Information</h4>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    {selectedOrder.customerName && <p>Name: {selectedOrder.customerName}</p>}
                                    {selectedOrder.customerMobile && <p>Mobile: {selectedOrder.customerMobile}</p>}
                                  </div>
                                </div>
                              )}

                              {/* Items */}
                              <div className="glass rounded-lg p-4">
                                <h4 className="font-medium mb-3">Items ({selectedOrder.items.length})</h4>
                                <div className="space-y-2">
                                  {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                                      <div>
                                        <p className="font-medium text-sm">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          ₹{item.price} x {item.quantity}
                                          {item.discount > 0 && ` (${item.discount}% off)`}
                                        </p>
                                      </div>
                                      <p className="font-medium">₹{item.total.toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Payment Summary */}
                              <div className="glass rounded-lg p-4">
                                <h4 className="font-medium mb-3">Payment Summary</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Discount:</span>
                                    <span className="text-accent">-₹{selectedOrder.totalDiscount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-medium pt-2 border-t border-border">
                                    <span>Total Paid:</span>
                                    <span className="text-primary">₹{selectedOrder.finalAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Payment Method:</span>
                                    <span>{selectedOrder.paymentMethod.toUpperCase()}</span>
                                  </div>
                                  {selectedOrder.cashGiven && (
                                    <>
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Cash Given:</span>
                                        <span>₹{selectedOrder.cashGiven.toFixed(2)}</span>
                                      </div>
                                      {selectedOrder.changeAmount && selectedOrder.changeAmount > 0 && (
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>Change Returned:</span>
                                          <span>₹{selectedOrder.changeAmount.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => generateBill(order)}
                        className="glass hover:neon-accent"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => printBill(order)}
                        className="glass hover:neon-secondary"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;