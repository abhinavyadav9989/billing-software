import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Package, AlertTriangle, TrendingDown } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Product, Order, DashboardStats } from '@/types';

const Dashboard = () => {
  const [products] = useLocalStorage<Product[]>('pos_products', []);
  const [orders] = useLocalStorage<Order[]>('pos_orders', []);
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    profit: 0,
    lowStockItems: [],
    fastStockoutProducts: [],
    lessSoldProducts: []
  });

  useEffect(() => {
    calculateStats();
  }, [orders, products, filterPeriod]);

  const calculateStats = () => {
    const now = new Date();
    let startDate = new Date();

    switch (filterPeriod) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredOrders = orders.filter(order => 
      new Date(order.createdAt) >= startDate && order.paymentStatus === 'completed'
    );

    const todaySales = filteredOrders.reduce((sum, order) => sum + order.finalAmount, 0);
    
    // Calculate profit (difference between selling price and cost price)
    const profit = filteredOrders.reduce((sum, order) => {
      const orderProfit = order.items.reduce((itemSum, item) => {
        const product = products.find(p => p.id === item.productId);
        const costPrice = product?.costPrice || item.price * 0.7; // Assume 30% margin if no cost price
        return itemSum + ((item.price - costPrice) * item.quantity);
      }, 0);
      return sum + orderProfit;
    }, 0);

    // Low stock items (stock below stockLevel)
    const lowStockItems = products.filter(product => product.stock <= product.stockLevel);

    // Fast stockout products (high sales velocity)
    const productSales = products.map(product => {
      const totalSold = filteredOrders.reduce((sum, order) => {
        const itemQuantity = order.items
          .filter(item => item.productId === product.id)
          .reduce((qty, item) => qty + item.quantity, 0);
        return sum + itemQuantity;
      }, 0);
      return { ...product, totalSold };
    });

    const fastStockoutProducts = productSales
      .filter(product => product.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // Less sold products
    const lessSoldProducts = productSales
      .sort((a, b) => a.totalSold - b.totalSold)
      .slice(0, 5);

    setStats({
      todaySales,
      profit,
      lowStockItems,
      fastStockoutProducts,
      lessSoldProducts
    });
  };

  const StatCard = ({ title, value, icon: Icon, trend, className = "" }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: number;
    className?: string;
  }) => (
    <Card className={`glass-card ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              {typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
            </p>
            {trend !== undefined && (
              <p className={`text-xs mt-1 flex items-center ${trend >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(trend).toFixed(1)}%
              </p>
            )}
          </div>
          <div className="p-3 rounded-2xl bg-gradient-primary neon-primary">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <Select value={filterPeriod} onValueChange={(value: any) => setFilterPeriod(value)}>
          <SelectTrigger className="w-32 glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Sales"
          value={stats.todaySales}
          icon={DollarSign}
          className="neon-primary"
        />
        <StatCard
          title="Profit"
          value={stats.profit}
          icon={TrendingUp}
          className="neon-accent"
        />
        <StatCard
          title="Low Stock Alert"
          value={stats.lowStockItems.length}
          icon={AlertTriangle}
          className="neon-destructive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">All items are well stocked!</p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockItems.slice(0, 5).map(product => (
                  <div key={product.id} className="flex justify-between items-center p-3 glass rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">Low</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-accent" />
              Fast Moving Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.fastStockoutProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No sales data available</p>
            ) : (
              <div className="space-y-3">
                {stats.fastStockoutProducts.map(product => (
                  <div key={product.id} className="flex justify-between items-center p-3 glass rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-accent">{product.totalSold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-secondary" />
              Slow Moving Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lessSoldProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No products available</p>
            ) : (
              <div className="space-y-3">
                {stats.lessSoldProducts.map(product => (
                  <div key={product.id} className="flex justify-between items-center p-3 glass rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-secondary">{product.totalSold || 0} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;