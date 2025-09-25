import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const PLATFORM_EMAIL = 'ravi.abhinavyadav@gmail.com';

const AdminOnboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPlatformAdmin = user?.email?.toLowerCase() === PLATFORM_EMAIL;

  const [clientType, setClientType] = useState<'org' | 'outlet' | ''>('');
  const [clientName, setClientName] = useState('');
  const [clientLocation, setClientLocation] = useState('');
  const [parentOrgId, setParentOrgId] = useState('');
  const [orgOptions, setOrgOptions] = useState<{ id: string; name: string }[]>([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrgs = async () => {
      const { data, error } = await supabase.from('clients').select('id,name').eq('type', 'org');
      if (!error && data) setOrgOptions(data as any);
    };
    if (isPlatformAdmin) loadOrgs();
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Onboard</h1>
        <p className="text-muted-foreground">You are not authorized to view this page.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientType || !clientName) {
      toast({ title: 'Missing data', description: 'Select client type and enter name', variant: 'destructive' });
      return;
    }
    if (clientType === 'outlet' && !parentOrgId) {
      toast({ title: 'Missing org', description: 'Select parent organization for outlet', variant: 'destructive' });
      return;
    }
    if (!fullName || !email || !password || !confirmPassword) {
      toast({ title: 'Missing user fields', description: 'Enter Full Name, Email, Passwords', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Password mismatch', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // 1) Create client row
      const clientPayload: any = {
        type: clientType,
        name: clientName,
        location: clientLocation || null,
        parent_client_id: clientType === 'outlet' ? parentOrgId : null,
        created_by: user!.id,
      };
      const { data: clientData, error: clientErr } = await supabase.from('clients').insert(clientPayload).select('id').single();
      if (clientErr) throw clientErr;

      const clientId = clientData!.id as string;

      // 2) Sign up the user (email confirmation enabled)
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` }
      });
      if (signErr) throw signErr;

      // 3) We cannot add membership until the user verifies and logs in (we need their user_id).
      //    So we leave a note to add membership after the user signs in.
      toast({ title: 'Verification sent', description: 'Client created. Invite sent. After verification, add membership.', });
      navigate('/admin');
    } catch (err: any) {
      toast({ title: 'Onboarding failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Onboard Client</h1>
      </div>

      <Card className="glass-card max-w-3xl">
        <CardHeader>
          <CardTitle>Client & User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Type</Label>
                <Select value={clientType} onValueChange={(v: any) => setClientType(v)}>
                  <SelectTrigger className="glass"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="org">Organization</SelectItem>
                    <SelectItem value="outlet">Outlet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="glass" placeholder="Acme Pvt Ltd / Outlet 1" />
              </div>
            </div>

            {clientType === 'outlet' && (
              <div className="space-y-2">
                <Label>Parent Organization</Label>
                <Select value={parentOrgId} onValueChange={setParentOrgId}>
                  <SelectTrigger className="glass"><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent className="glass-card">
                    {orgOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location (optional)</Label>
                <Input value={clientLocation} onChange={(e) => setClientLocation(e.target.value)} className="glass" placeholder="City, Address" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="glass" placeholder="Owner / Manager name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass" placeholder="owner@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="glass" />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="glass" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-gradient-primary neon-primary text-primary-foreground" disabled={loading}>
                {loading ? 'Submitting...' : 'Create & Invite'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOnboard;


