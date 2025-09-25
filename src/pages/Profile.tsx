import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Store, Mail, Phone, MapPin, FileText, Upload, Save } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StoreProfile } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase';

const Profile = () => {
  const { user } = useAuth();
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [formData, setFormData] = useState<StoreProfile>({
    name: 'My Store',
    email: user?.email || '',
    phone: '',
    address: '',
    gstNumber: '',
    logo: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('store_profile')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (error) {
        // silent fail; first-time users may not have profile yet
        return;
      }
      if (data) {
        const sp: StoreProfile = {
          name: data.title || 'My Store',
          email: formData.email,
          phone: data.phone || '',
          address: data.location || '',
          gstNumber: data.gst_number || '',
          logo: data.profile_image_url || ''
        };
        setStoreProfile(sp);
        setFormData(sp);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Error", description: "Store name and email are required", variant: "destructive" });
      return;
    }
    (async () => {
      if (!user) return;
      const payload = {
        owner_id: user.id,
        title: formData.name,
        phone: formData.phone,
        location: formData.address,
        gst_number: formData.gstNumber,
        profile_image_url: formData.logo
      } as const;
      const { error } = await supabase
        .from('store_profile')
        .upsert(payload, { onConflict: 'owner_id' });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      setStoreProfile(formData);
      setIsEditing(false);
      toast({ title: "Success", description: "Profile updated successfully!" });
    })();
  };

  const handleCancel = () => {
    setFormData(storeProfile);
    setIsEditing(false);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setFormData({ ...formData, logo: data.publicUrl });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Store Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-gradient-primary neon-primary hover:opacity-90 text-primary-foreground">
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel} className="glass">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary neon-primary hover:opacity-90 text-primary-foreground">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2 text-primary" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name *</Label>
                  <Input
                    id="storeName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="glass"
                    placeholder="Enter store name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="glass"
                    placeholder="store@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="glass"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    disabled={!isEditing}
                    className="glass"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Store Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  className="glass resize-none"
                  placeholder="Enter complete store address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* User Account Information */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="glass rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-gradient-primary neon-primary">
                    <User className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{user?.name}</h4>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Logo & Quick Info */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Store Logo</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Store Logo"
                    className="w-24 h-24 mx-auto rounded-2xl object-cover glass p-2"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto rounded-2xl glass flex items-center justify-center">
                    <Store className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              {isEditing && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="glass"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground truncate">{formData.email || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-xs text-muted-foreground">{formData.phone || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.address || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">GST Number</p>
                  <p className="text-xs text-muted-foreground">{formData.gstNumber || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;