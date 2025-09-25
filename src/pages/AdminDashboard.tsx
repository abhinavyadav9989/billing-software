import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

const PLATFORM_EMAIL = 'ravi.abhinavyadav@gmail.com';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orgCount, setOrgCount] = useState<number>(0);
  const [outletCount, setOutletCount] = useState<number>(0);
  const isPlatformAdmin = user?.email?.toLowerCase() === PLATFORM_EMAIL;

  useEffect(() => {
    const loadCounts = async () => {
      const orgRes = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('type', 'org');
      const outletRes = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('type', 'outlet');
      setOrgCount(orgRes.count || 0);
      setOutletCount(outletRes.count || 0);
    };
    if (isPlatformAdmin) loadCounts();
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted-foreground">You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Platform Admin</h1>
        <Button className="bg-gradient-primary neon-primary text-primary-foreground" onClick={() => navigate('/admin/onboard')}>
          Onboard Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{orgCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Outlets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{outletCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;


