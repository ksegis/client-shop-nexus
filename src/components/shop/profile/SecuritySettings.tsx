
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useProfileData } from '@/hooks/profile/useProfileData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ShieldAlert } from 'lucide-react';
import { mfaService } from '@/services/mfa/mfaService';
import { MfaSetupDialog } from '@/components/auth/MfaSetupDialog';
import { useToast } from '@/hooks/use-toast';

export function SecuritySettings() {
  const { user } = useAuth();
  const { profileData, refreshProfile } = useProfileData();
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleDisableMfa = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const success = await mfaService.disableForUser(user.id);
      
      if (success) {
        toast({
          title: "MFA Disabled",
          description: "Two-factor authentication has been disabled for your account."
        });
        refreshProfile();
      } else {
        toast({
          title: "Error",
          description: "Failed to disable two-factor authentication.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error disabling MFA:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  {profileData?.mfa_enabled
                    ? "Your account is protected with two-factor authentication"
                    : "Add an extra layer of security to your account"}
                </p>
              </div>
              
              {profileData?.mfa_enabled ? (
                <Button 
                  variant="destructive" 
                  onClick={handleDisableMfa}
                  disabled={isLoading}
                >
                  {isLoading ? "Disabling..." : "Disable 2FA"}
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  onClick={() => setShowMfaSetup(true)}
                >
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500 mt-1" />
              <div>
                <h3 className="text-lg font-medium">Security Recommendations</h3>
                <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
                  {!profileData?.mfa_enabled && (
                    <li>Enable two-factor authentication for increased security</li>
                  )}
                  <li>Use a strong, unique password for your account</li>
                  <li>Regularly review your account activity for suspicious actions</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* MFA Setup Dialog */}
      {user && (
        <MfaSetupDialog
          open={showMfaSetup}
          onOpenChange={setShowMfaSetup}
          userId={user.id}
          userEmail={user.email || ''}
          onComplete={refreshProfile}
        />
      )}
    </>
  );
}
