import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Users, 
  Clock, 
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemSettings {
  general: {
    companyName: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  database: {
    backupFrequency: string;
    retentionDays: number;
    autoBackup: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: string;
    twoFactorAuth: boolean;
    ipWhitelist: string[];
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    systemAlerts: boolean;
    maintenanceMode: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    logLevel: string;
    maxFileSize: number;
    compressionEnabled: boolean;
  };
}

const defaultSettings: SystemSettings = {
  general: {
    companyName: 'Custom Truck Connections',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    language: 'en'
  },
  database: {
    backupFrequency: 'daily',
    retentionDays: 30,
    autoBackup: true
  },
  security: {
    sessionTimeout: 30,
    passwordPolicy: 'strong',
    twoFactorAuth: false,
    ipWhitelist: []
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    systemAlerts: true,
    maintenanceMode: false
  },
  performance: {
    cacheEnabled: true,
    logLevel: 'info',
    maxFileSize: 10,
    compressionEnabled: true
  }
};

const STORAGE_KEY = 'ctc_system_settings';

const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
      toast({
        title: "Settings Load Error",
        description: "Failed to load saved settings. Using defaults.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Save settings to localStorage
  const saveSettingsToStorage = (newSettings: SystemSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
      toast({
        title: "Settings Save Error",
        description: "Failed to save settings locally.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage immediately
      saveSettingsToStorage(settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated and saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save system settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateGeneralSettings = (key: string, value: string) => {
    const newSettings = {
      ...settings,
      general: { ...settings.general, [key]: value }
    };
    setSettings(newSettings);
    // Auto-save to localStorage on change
    saveSettingsToStorage(newSettings);
  };

  const updateDatabaseSettings = (key: string, value: any) => {
    const newSettings = {
      ...settings,
      database: { ...settings.database, [key]: value }
    };
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  const updateSecuritySettings = (key: string, value: any) => {
    const newSettings = {
      ...settings,
      security: { ...settings.security, [key]: value }
    };
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  const updateNotificationSettings = (key: string, value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, [key]: value }
    };
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  const updatePerformanceSettings = (key: string, value: any) => {
    const newSettings = {
      ...settings,
      performance: { ...settings.performance, [key]: value }
    };
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="performance">
            <HardDrive className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    value={settings.general.companyName}
                    onChange={(e) => updateGeneralSettings('companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.general.timezone} onValueChange={(value) => updateGeneralSettings('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={settings.general.dateFormat} onValueChange={(value) => updateGeneralSettings('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.general.currency} onValueChange={(value) => updateGeneralSettings('currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>Configure database backup and maintenance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Last backup completed successfully on {new Date().toLocaleDateString()}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch id="twoFactorAuth" />
                <Label htmlFor="twoFactorAuth">Require Two-Factor Authentication</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch id="emailNotifications" defaultChecked />
                <Label htmlFor="emailNotifications">Email Notifications</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>Configure system performance and optimization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Network className="w-5 h-5 text-green-500" />
                    <span className="font-medium">System Status</span>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Disk Usage</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">45%</span>
                    <span className="text-gray-500 ml-1">used</span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Active Users</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">12</span>
                    <span className="text-gray-500 ml-1">online</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;

