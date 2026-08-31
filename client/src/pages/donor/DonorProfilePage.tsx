import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { donorService } from '../../services/donor.service.js';
import { ProfileForm } from '../../components/donor/ProfileForm.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { User, Shield, Info, Bell, CheckCircle2 } from 'lucide-react';
import { formatBloodGroup, formatDate } from '../../lib/utils.js';

export const DonorProfilePage: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['donor', 'profile'],
    queryFn: () => donorService.getProfile(),
  });

  const [notifConsent, setNotifConsent] = useState(true);
  const [savedConsent, setSavedConsent] = useState(false);

  if (isLoading) {
    return <LoadingSpinner label="Loading donor profile..." />;
  }

  if (isError || !profile) {
    return (
      <ErrorState
        title="Could not load profile"
        message="Failed to retrieve donor profile details."
        onRetry={() => refetch()}
      />
    );
  }

  const handleUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] });
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  const handleSaveConsent = () => {
    setSavedConsent(true);
    setTimeout(() => setSavedConsent(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Donor Profile & Settings</h1>
        <p className="text-xs text-slate-500">
          Manage your personal contact details, residential address, and outreach preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Edit Form & Preferences */}
        <div className="md:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-crimson-600" />
                Edit Personal Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm initialData={profile} onSuccess={handleUpdateSuccess} />
            </CardContent>
          </Card>

          {/* Donation Opportunities & Outreach Consent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-crimson-600" />
                Outreach & Notification Consent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">
                    Receive Blood Donation Outreach Alerts
                  </span>
                  <p className="text-2xs text-slate-500 leading-relaxed">
                    Allow clinical coordinators to send you in-app alerts when a matching blood request requires your blood type in your area.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifConsent}
                  onChange={(e) => setNotifConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-crimson-600 focus:ring-crimson-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedConsent ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Preferences saved
                  </span>
                ) : <span />}
                <Button size="sm" variant="outline" onClick={handleSaveConsent}>
                  Update Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Clinical Info Card (Read-only clinical fields) */}
        <div className="md:col-span-5 space-y-4">
          <Card className="bg-slate-50/70 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5 text-slate-700">
                <Shield className="w-4 h-4 text-emerald-600" />
                Verified Clinical Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Registered Blood Group</span>
                <span className="text-sm font-bold text-crimson-700">
                  {formatBloodGroup(profile.bloodGroup)} ({profile.bloodGroup.replace('_', ' ')})
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Date of Birth</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatDate(profile.dateOfBirth)}
                </span>
              </div>

              <div className="flex items-start gap-2 p-3 bg-slate-100 rounded-lg text-2xs text-slate-500">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  To change clinical identifiers such as registered blood group or date of birth,
                  please visit an authorized blood bank with valid government-issued medical documentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
