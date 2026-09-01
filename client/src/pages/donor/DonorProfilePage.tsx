import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donorService } from '../../services/donor.service.js';
import { ProfileForm } from '../../components/donor/ProfileForm.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  User,
  Shield,
  Info,
  Bell,
  CheckCircle2,
  AlertCircle,
  Mail,
  Smartphone,
  AppWindow,
  Clock,
  MapPin,
} from 'lucide-react';
import { formatBloodGroup, formatDate } from '../../lib/utils.js';
import { NotificationChannel, DonorConsentPreferences } from '../../types/index.js';

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

  const existingPrefs: DonorConsentPreferences = {
    allowBloodRequestNotifications:
      (profile?.preferences as any)?.allowBloodRequestNotifications ?? true,
    preferredNotificationChannel:
      (profile?.preferences as any)?.preferredNotificationChannel ?? 'IN_APP',
    preferredContactTime:
      (profile?.preferences as any)?.preferredContactTime ?? 'ANYTIME',
    locationSharingConsent:
      (profile?.preferences as any)?.locationSharingConsent ?? false,
  };

  const [allowNotifs, setAllowNotifs] = useState<boolean>(existingPrefs.allowBloodRequestNotifications);
  const [channel, setChannel] = useState<NotificationChannel>(existingPrefs.preferredNotificationChannel);
  const [contactTime, setContactTime] = useState<'ANYTIME' | 'MORNING' | 'AFTERNOON' | 'EVENING'>(
    existingPrefs.preferredContactTime || 'ANYTIME'
  );
  const [locationConsent, setLocationConsent] = useState<boolean>(existingPrefs.locationSharingConsent || false);

  const [prefsSuccessMsg, setPrefsSuccessMsg] = useState<string | null>(null);
  const [prefsErrorMsg, setPrefsErrorMsg] = useState<string | null>(null);

  // Sync state when profile loads
  React.useEffect(() => {
    if (profile?.preferences) {
      const p = profile.preferences as any;
      if (typeof p.allowBloodRequestNotifications === 'boolean') {
        setAllowNotifs(p.allowBloodRequestNotifications);
      }
      if (p.preferredNotificationChannel) {
        setChannel(p.preferredNotificationChannel);
      }
      if (p.preferredContactTime) {
        setContactTime(p.preferredContactTime);
      }
      if (typeof p.locationSharingConsent === 'boolean') {
        setLocationConsent(p.locationSharingConsent);
      }
    }
  }, [profile]);

  const updatePrefsMutation = useMutation({
    mutationFn: (prefs: DonorConsentPreferences) =>
      donorService.updateProfile({
        preferences: prefs,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setPrefsSuccessMsg('Notification preferences & consent saved successfully!');
      setPrefsErrorMsg(null);
      setTimeout(() => setPrefsSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setPrefsErrorMsg(err.response?.data?.message || err.message || 'Failed to save preferences.');
      setPrefsSuccessMsg(null);
    },
  });

  const handleSaveConsent = (e: React.FormEvent) => {
    e.preventDefault();
    updatePrefsMutation.mutate({
      allowBloodRequestNotifications: allowNotifs,
      preferredNotificationChannel: channel,
      preferredContactTime: contactTime,
      locationSharingConsent: locationConsent,
    });
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-left">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
          Donor Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-1">
          Manage your personal contact details, residential address, and outreach communication preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Personal Form & Notification Consent */}
        <div className="md:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-[#D92D45]" />
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
                <Bell className="w-4 h-4 text-[#D92D45]" />
                Donation Outreach & Notification Consent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveConsent} className="space-y-5">
                {prefsSuccessMsg && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 p-3 text-xs text-[#15803D] bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                    <span>{prefsSuccessMsg}</span>
                  </div>
                )}

                {prefsErrorMsg && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 p-3 text-xs text-[#B42318] bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0" />
                    <span>{prefsErrorMsg}</span>
                  </div>
                )}

                {/* Main Opt-in Checkbox */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4]">
                  <div className="space-y-1">
                    <label
                      htmlFor="allow-notifs-checkbox"
                      className="text-xs font-bold text-[#1F2937] block cursor-pointer"
                    >
                      Allow Blood Request Notifications
                    </label>
                    <p className="text-2xs text-[#667085] leading-relaxed">
                      Allow blood bank coordinators to send you targeted outreach alerts when a local hospital or clinic needs blood matching your blood type.
                    </p>
                  </div>
                  <input
                    id="allow-notifs-checkbox"
                    type="checkbox"
                    checked={allowNotifs}
                    onChange={(e) => setAllowNotifs(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#E7E5E4] text-[#D92D45] focus:ring-[#D92D45] cursor-pointer"
                  />
                </div>

                {/* Preferred Notification Channel */}
                {allowNotifs && (
                  <div className="space-y-3 pt-2 border-t border-[#E7E5E4]/80">
                    <label className="text-xs font-bold text-[#1F2937] block">
                      Preferred Notification Channel
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {/* In-App Option */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          channel === 'IN_APP'
                            ? 'bg-[#FFF0F2] border-[#FFE4E8] ring-1 ring-[#D92D45]/30'
                            : 'bg-white border-[#E7E5E4] hover:bg-[#FAF9F7]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="notifChannel"
                          value="IN_APP"
                          checked={channel === 'IN_APP'}
                          onChange={() => setChannel('IN_APP')}
                          className="mt-1 text-[#D92D45] focus:ring-[#D92D45]"
                        />
                        <div className="space-y-0.5 flex-1">
                          <div className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                            <AppWindow className="w-3.5 h-3.5 text-[#D92D45]" />
                            In-App Portal Alerts (Default & Privacy-Preserving)
                          </div>
                          <p className="text-2xs text-[#667085] leading-relaxed">
                            Alerts appear exclusively inside your HemaCare donor portal bell and dashboard. No external messages sent.
                          </p>
                        </div>
                      </label>

                      {/* Email Option */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          channel === 'EMAIL'
                            ? 'bg-[#FFF0F2] border-[#FFE4E8] ring-1 ring-[#D92D45]/30'
                            : 'bg-white border-[#E7E5E4] hover:bg-[#FAF9F7]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="notifChannel"
                          value="EMAIL"
                          checked={channel === 'EMAIL'}
                          onChange={() => setChannel('EMAIL')}
                          className="mt-1 text-[#D92D45] focus:ring-[#D92D45]"
                        />
                        <div className="space-y-0.5 flex-1">
                          <div className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#D92D45]" />
                            Email Alerts
                          </div>
                          <p className="text-2xs text-[#667085] leading-relaxed">
                            Transfusion alerts sent to <strong>{profile.user?.email || 'your registered email'}</strong>. Message contains minimum necessary details (blood type, hospital area, required deadline). Never contains patient records or diagnosis.
                          </p>
                        </div>
                      </label>

                      {/* SMS Option */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          channel === 'SMS'
                            ? 'bg-[#FFF0F2] border-[#FFE4E8] ring-1 ring-[#D92D45]/30'
                            : 'bg-white border-[#E7E5E4] hover:bg-[#FAF9F7]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="notifChannel"
                          value="SMS"
                          checked={channel === 'SMS'}
                          onChange={() => setChannel('SMS')}
                          className="mt-1 text-[#D92D45] focus:ring-[#D92D45]"
                        />
                        <div className="space-y-0.5 flex-1">
                          <div className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-[#D92D45]" />
                            SMS Mobile Alerts
                          </div>
                          <p className="text-2xs text-[#667085] leading-relaxed">
                            Urgent SMS text notifications sent to <strong>{profile.contactNumber}</strong> for high-priority local emergency requests. Message frequency depends on local hospital needs. Standard carrier rates may apply.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Preferred Contact Time Window */}
                    <div className="pt-3 space-y-1.5">
                      <label className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#667085]" />
                        Preferred Contact Window
                      </label>
                      <select
                        value={contactTime}
                        onChange={(e) => setContactTime(e.target.value as any)}
                        className="w-full text-xs rounded-xl border border-[#E7E5E4] bg-white p-2.5 text-[#1F2937] focus:ring-2 focus:ring-[#D92D45]/20 focus:border-[#D92D45]"
                      >
                        <option value="ANYTIME">Anytime (24/7 for urgent clinical needs)</option>
                        <option value="MORNING">Morning (8:00 AM - 12:00 PM)</option>
                        <option value="AFTERNOON">Afternoon (12:00 PM - 5:00 PM)</option>
                        <option value="EVENING">Evening (5:00 PM - 9:00 PM)</option>
                      </select>
                    </div>

                    {/* Location Proximity Consent */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={locationConsent}
                          onChange={(e) => setLocationConsent(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-[#E7E5E4] text-[#D92D45] focus:ring-[#D92D45] cursor-pointer"
                        />
                        <div className="space-y-0.5 text-2xs text-[#667085]">
                          <span className="font-bold text-[#1F2937] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#667085]" />
                            Location Proximity Matching Consent
                          </span>
                          <span>
                            Allow using your residential city/district ({profile.address}) to prioritize nearby emergency requests. Exact GPS tracking is never performed.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-3 border-t border-[#E7E5E4]">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={updatePrefsMutation.isPending}
                  >
                    Save Outreach Preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Basic Donation Eligibility & Identifiers */}
        <div className="md:col-span-5 space-y-4">
          <Card className="bg-[#FAF9F7] border-[#E7E5E4]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5 text-[#1F2937]">
                <Shield className="w-4 h-4 text-[#15803D]" />
                Verified Clinical Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#E7E5E4]">
                <span className="text-[#667085] block font-medium">Registered Blood Group</span>
                <span className="text-sm font-bold text-[#D92D45]">
                  {formatBloodGroup(profile.bloodGroup)} ({profile.bloodGroup.replace('_', ' ')})
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E7E5E4]">
                <span className="text-[#667085] block font-medium">Date of Birth</span>
                <span className="text-sm font-bold text-[#1F2937]">
                  {formatDate(profile.dateOfBirth)}
                </span>
              </div>

              <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-[#E7E5E4] text-2xs text-[#667085] leading-relaxed">
                <Info className="w-4 h-4 text-[#667085] shrink-0 mt-0.5" />
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
