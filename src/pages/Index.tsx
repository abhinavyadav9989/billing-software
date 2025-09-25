import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Zap, BarChart3, Package, ShoppingCart, FileText, User } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    { icon: BarChart3, title: 'Dashboard Analytics', description: 'Real-time sales insights and business metrics' },
    { icon: Package, title: 'Inventory Management', description: 'Track products, stock levels, and alerts' },
    { icon: ShoppingCart, title: 'Smart Billing', description: 'Quick QR/barcode scanning and checkout' },
    { icon: FileText, title: 'Order History', description: 'Complete sales records and reporting' },
    { icon: User, title: 'Profile Management', description: 'Store details and customization' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <div className="animate-float mb-8">
          <div className="p-6 rounded-3xl bg-gradient-primary neon-primary animate-glow">
            <Zap className="h-16 w-16 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          Aura Bill POS
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          Experience the future of retail with our futuristic Point of Sale system. 
          Streamline your business with advanced analytics, smart inventory management, and lightning-fast billing.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => navigate('/login')}
            className="bg-gradient-primary neon-primary hover:opacity-90 text-primary-foreground px-8 py-3 text-lg"
          >
            Get Started
          </Button>
          <Button 
            variant="outline"
            className="glass border-primary/30 text-foreground hover:bg-primary/10 px-8 py-3 text-lg"
          >
            Learn More
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            Powerful Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="glass-card p-6 hover:neon-primary transition-all duration-300 group">
                  <div className="p-3 rounded-2xl bg-gradient-primary neon-primary mb-4 inline-block group-hover:animate-glow">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
