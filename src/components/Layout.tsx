import React from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BarChart3, Package, ShoppingCart, FileText, User, LogOut, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: ShoppingCart, label: 'Billing', path: '/cart' },
    { icon: FileText, label: 'Orders', path: '/orders' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="glass-card border-r border-border/50">
          <SidebarHeader className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-primary neon-primary">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Aura Bill
                </h1>
                <p className="text-xs text-muted-foreground">POS System</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="space-y-2 px-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive 
                          ? 'bg-gradient-primary text-primary-foreground neon-primary' 
                          : 'hover:bg-muted/50 text-foreground'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            <div className="mt-auto p-4">
              <div className="glass rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-foreground">Welcome back,</p>
                <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full glass border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 flex flex-col">
          <header className="glass-card border-b border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="lg:hidden" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your business efficiently
                  </p>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;