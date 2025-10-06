import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Package, QrCode, Upload } from 'lucide-react';
import { Product } from '@/types';
import { toast } from '@/components/ui/use-toast';
import supabase from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    costPrice: '',
    discount: '',
    stock: '', // number of packs/items
    stockLevel: '',
    category: '',
    barcode: ''
  });
  // Units and org selection
  const [measureCategory, setMeasureCategory] = useState<'liquid'|'solid'|'piece'>('piece');
  const [unit, setUnit] = useState<'ml'|'l'|'g'|'kg'|'pcs'>('pcs');
  const [packSize, setPackSize] = useState('1'); // in chosen unit
  const [orgClientId, setOrgClientId] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const query = supabase
        .from('products')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      setProducts((data || []) as any);
    };
    load();
  }, [user]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setNewProduct({
      name: '',
      price: '',
      costPrice: '',
      discount: '',
      stock: '',
      stockLevel: '',
      category: '',
      barcode: ''
    });
    setEditingProduct(null);
    setMeasureCategory('piece');
    setUnit('pcs');
    setPackSize('1');
  };

  const toBase = (qty: number) => {
    if (measureCategory === 'liquid') {
      const size = unit === 'l' ? Number(packSize) * 1000 : Number(packSize);
      return qty * size; // base ml
    }
    if (measureCategory === 'solid') {
      const size = unit === 'kg' ? Number(packSize) * 1000 : Number(packSize);
      return qty * size; // base g
    }
    return qty; // pcs
  };

  const baseUnit = () => {
    if (measureCategory === 'liquid') return 'ml';
    if (measureCategory === 'solid') return 'g';
    return 'pcs';
  };

  const quantityPerItem = () => {
    if (measureCategory === 'liquid') return unit === 'l' ? Number(packSize) * 1000 : Number(packSize);
    if (measureCategory === 'solid') return unit === 'kg' ? Number(packSize) * 1000 : Number(packSize);
    return 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return;
    }

    const payload: any = {
      name: newProduct.name,
      description: null,
      price: parseFloat(newProduct.price),
      cost_price: newProduct.costPrice ? parseFloat(newProduct.costPrice) : null,
      discount: parseFloat(newProduct.discount) || 0,
      stock: toBase(parseInt(newProduct.stock, 10)),
      stock_level: parseInt(newProduct.stockLevel || '5', 10),
      category: newProduct.category || null,
      barcode: newProduct.barcode || `BAR${Date.now()}`,
      created_by: user.id,
      org_client_id: orgClientId || null,
      measure_category: measureCategory,
      base_unit: baseUnit(),
      quantity_per_item: quantityPerItem()
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload as any).eq('id', editingProduct.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Success', description: 'Product updated successfully!' });
    } else {
      const { error } = await supabase.from('products').insert(payload as any);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Success', description: 'Product added successfully!' });
    }

    // reload list
    const { data } = await supabase.from('products').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
    setProducts((data || []) as any);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() || '',
      discount: product.discount.toString(),
      stock: '1',
      stockLevel: product.stockLevel.toString(),
      category: product.category || '',
      barcode: product.barcode || ''
    });
    setIsAddDialogOpen(true);
    // set units from product
    setMeasureCategory((product as any).measure_category || 'piece');
    const bu = (product as any).base_unit || 'pcs';
    setUnit(bu === 'ml' ? 'ml' : bu === 'g' ? 'g' : 'pcs');
    setPackSize(((product as any).quantity_per_item || 1).toString());
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setProducts(products.filter(p => p.id !== id));
    toast({ title: 'Success', description: 'Product deleted successfully!' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary neon-primary hover:opacity-90 text-primary-foreground" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product details' : 'Enter product information to add to inventory'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="glass"
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="glass"
                    placeholder="Product category"
                  />
                </div>
              </div>

              {/* Org selection (temporary) */}
              <div className="space-y-2">
                <Label htmlFor="org">Organization Client ID (optional)</Label>
                <Input id="org" value={orgClientId} onChange={(e) => setOrgClientId(e.target.value)} className="glass" placeholder="org_client_id" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="glass"
                    placeholder="₹0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    className="glass"
                    placeholder="₹0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={newProduct.discount}
                    onChange={(e) => setNewProduct({ ...newProduct, discount: e.target.value })}
                    className="glass"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="glass"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>
              {/* Units */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Measure Category</Label>
                  <select className="glass w-full h-10 rounded-md px-3" value={measureCategory} onChange={(e) => {
                    const v = e.target.value as 'liquid'|'solid'|'piece';
                    setMeasureCategory(v);
                    setUnit(v==='liquid'?'ml':v==='solid'?'g':'pcs');
                    setPackSize('1');
                  }}>
                    <option value="piece">Piece</option>
                    <option value="liquid">Liquid</option>
                    <option value="solid">Solid</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <select className="glass w-full h-10 rounded-md px-3" value={unit} onChange={(e)=>setUnit(e.target.value as any)}>
                    {measureCategory==='liquid' && (<>
                      <option value="ml">ml</option>
                      <option value="l">L</option>
                    </>)}
                    {measureCategory==='solid' && (<>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                    </>)}
                    {measureCategory==='piece' && (<option value="pcs">pcs</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Pack Size</Label>
                  <Input value={packSize} onChange={(e)=>setPackSize(e.target.value)} className="glass" placeholder={measureCategory==='piece'?'1':'e.g. 500'} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="glass"
                    placeholder="Number of packs/items"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockLevel">Low Stock Alert Level</Label>
                  <Input
                    id="stockLevel"
                    type="number"
                    value={newProduct.stockLevel}
                    onChange={(e) => setNewProduct({ ...newProduct, stockLevel: e.target.value })}
                    className="glass"
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="glass">
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary neon-primary hover:opacity-90 text-primary-foreground">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Products ({products.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass w-64"
                />
              </div>
              <Button variant="outline" className="glass" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {products.length === 0 ? 'Add your first product to get started' : 'Try adjusting your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-gradient-primary neon-primary">
                      <Package className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{product.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="glass text-xs">
                          ₹{product.price}
                        </Badge>
                        {product.category && (
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                        <Badge 
                          variant={product.stock <= product.stockLevel ? "destructive" : "default"}
                          className="text-xs"
                        >
                          Stock: {product.stock}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(product)}
                      className="glass hover:neon-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      className="glass hover:neon-destructive text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="glass hover:neon-secondary"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
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

export default Inventory;