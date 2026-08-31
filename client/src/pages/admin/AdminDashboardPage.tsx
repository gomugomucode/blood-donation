import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { BloodGroupBadge } from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { formatDate } from '../../lib/utils.js';
import {
  Users,
  CheckCircle2,
  Droplet,
  Activity,
  ArrowRight,
  MapPin,
  Calendar,
  HeartPulse,
  Plus,
  Flame,
} from 'lucide-react';
import { BloodGroup } from '../../types/index.js';

export const AdminDashboardPage: React.FC = () => {
  const {
    data: metrics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.getDashboardMetrics(),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-card flex justify-center items-center">
        <LoadingSpinner label="Loading operational command center..." />
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card">
        <ErrorState
          title="Could not load dashboard metrics"
          message="Unable to retrieve clinical registry statistics."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const bloodGroupList: BloodGroup[] = [
    'O_NEGATIVE',
    'O_POSITIVE',
    'A_POSITIVE',
    'A_NEGATIVE',
    'B_POSITIVE',
    'B_NEGATIVE',
    'AB_POSITIVE',
    'AB_NEGATIVE',
  ];

  const reqMetrics = metrics.requestMetrics;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <HeartPulse className="w-8 h-8 text-rose-600 shrink-0" />
            Operations Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time voluntary registry telemetry, regional blood requests, and candidate matching pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link to="/admin/requests/create" className="w-full sm:w-auto">
            <Button variant="critical" size="md" className="w-full">
              <Plus className="w-4 h-4 mr-1.5" />
              New Blood Request
            </Button>
          </Link>
          <Link to="/admin/requests" className="w-full sm:w-auto">
            <Button variant="outline" size="md" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full">
              View Requests
            </Button>
          </Link>
        </div>
      </div>

      {/* Emergency Critical Requests Alert Section */}
      {reqMetrics && (reqMetrics.criticalRequests > 0 || reqMetrics.highRequests > 0) && (
        <div className="rounded-3xl border border-red-200 bg-red-50/95 p-5 text-xs sm:text-sm text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse-subtle">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-red-950 text-sm sm:text-base">
                Immediate Coordinator Attention Required
              </div>
              <p className="text-xs text-red-800 font-medium mt-0.5">
                Active urgent demands:{' '}
                <span className="font-extrabold text-red-700 font-mono">{reqMetrics.criticalRequests} CRITICAL</span> and{' '}
                <span className="font-extrabold text-amber-800 font-mono">{reqMetrics.highRequests} HIGH</span> urgency requests require donor outreach.
              </p>
            </div>
          </div>
          <Link to="/admin/requests">
            <Button size="sm" variant="danger" className="w-full sm:w-auto text-xs shrink-0">
              Triage Requests →
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Blood Requests"
          value={reqMetrics?.openRequests ?? 0}
          subtitle={`${reqMetrics?.partiallyFulfilledRequests ?? 0} in active fulfillment`}
          icon={HeartPulse}
          color="crimson"
        />

        <StatCard
          title="Eligible Donors"
          value={metrics.eligibleDonors}
          subtitle={`${Math.round((metrics.eligibleDonors / (metrics.totalDonors || 1)) * 100)}% of total registry ready`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Registered Donors"
          value={metrics.totalDonors}
          subtitle="Verified donor profiles"
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Recent Collections (30d)"
          value={metrics.recentDonationsCount}
          subtitle="Verified procedures completed"
          icon={Activity}
          color="indigo"
        />
      </div>

      {/* Blood Requests Coordination Pipeline */}
      {reqMetrics && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Regional Blood Request Pipeline
              </h2>
              <p className="text-2xs text-slate-500">Live breakdown by status and urgency priority</p>
            </div>
            <Link to="/admin/requests" className="text-xs font-bold text-rose-600 hover:text-rose-700">
              Manage All Requests →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Open</span>
              <div className="text-2xl font-extrabold text-blue-950 font-mono mt-1">{reqMetrics.openRequests}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-100">
              <span className="text-[11px] font-bold text-red-800 uppercase">Critical</span>
              <div className="text-2xl font-extrabold text-red-950 font-mono mt-1">{reqMetrics.criticalRequests}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
              <span className="text-[11px] font-bold text-amber-800 uppercase">High Priority</span>
              <div className="text-2xl font-extrabold text-amber-950 font-mono mt-1">{reqMetrics.highRequests}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100">
              <span className="text-[11px] font-bold text-orange-800 uppercase">Partial Filled</span>
              <div className="text-2xl font-extrabold text-orange-950 font-mono mt-1">{reqMetrics.partiallyFulfilledRequests}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Fulfilled Today</span>
              <div className="text-2xl font-extrabold text-emerald-950 font-mono mt-1">{reqMetrics.fulfilledTodayRequests}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Overdue/Expired</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{reqMetrics.expiredRequests}</div>
            </div>
          </div>
        </div>
      )}

      {/* Blood Group Distribution & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Blood Group Distribution */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Droplet className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registry Donors by Blood Group</h3>
                <p className="text-2xs text-slate-500">Inventory distribution across ABO and Rh systems</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {bloodGroupList.map((bg) => {
                const count = metrics.bloodGroupDistribution[bg] || 0;
                const percentage =
                  metrics.totalDonors > 0 ? Math.round((count / metrics.totalDonors) * 100) : 0;

                return (
                  <div
                    key={bg}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <BloodGroupBadge bloodGroup={bg} size="sm" />
                      <span className="text-[10px] font-extrabold text-slate-400 font-mono">{percentage}%</span>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">{count}</div>
                      <p className="text-[11px] text-slate-500 font-medium">registered</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Collections */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Verified Collections</h3>
                  <p className="text-2xs text-slate-500">Live clinical procedure audit feed</p>
                </div>
              </div>
              <Link
                to="/admin/donors"
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                Donor Registry →
              </Link>
            </div>

            {metrics.recentDonations.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500">
                No recent blood donation procedures recorded.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.recentDonations.map((donation) => (
                  <div key={donation.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {donation.donor.fullName}
                        </span>
                        <BloodGroupBadge bloodGroup={donation.donor.bloodGroup} size="sm" />
                      </div>
                      <p className="text-2xs text-slate-500 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        {donation.location}
                      </p>
                    </div>

                    <div className="text-right space-y-0.5 font-mono">
                      <span className="font-semibold text-slate-700 flex items-center justify-end gap-1 text-2xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(donation.donatedAt)}
                      </span>
                      {donation.notes && (
                        <span className="text-2xs text-slate-400 block max-w-xs truncate font-sans">
                          {donation.notes}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
