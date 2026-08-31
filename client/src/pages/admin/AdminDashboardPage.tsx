import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import { StatCard } from '../../components/common/StatCard.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card.js';
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
  AlertCircle,
  Clock,
  Plus,
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
    return <LoadingSpinner label="Loading administration analytics..." />;
  }

  if (isError || !metrics) {
    return (
      <ErrorState
        title="Could not load dashboard metrics"
        message="Unable to retrieve clinical registry statistics."
        onRetry={() => refetch()}
      />
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
    <div className="space-y-6">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Overview</h1>
          <p className="text-xs text-slate-500">
            Real-time voluntary registry metrics, blood supply requests, compatibility screening, and donor procedures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/requests/create">
            <Button variant="primary" size="sm" className="shadow-xs shadow-crimson-600/20">
              <Plus className="w-4 h-4 mr-1" />
              New Request
            </Button>
          </Link>
          <Link to="/admin/requests">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Blood Requests
            </Button>
          </Link>
        </div>
      </div>

      {/* Emergency & Blood Requests Banner (If critical requests exist) */}
      {reqMetrics && (reqMetrics.criticalRequests > 0 || reqMetrics.highRequests > 0) && (
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold text-red-950">Active Urgent Requests: </span>
              There {reqMetrics.criticalRequests === 1 ? 'is' : 'are'}{' '}
              <span className="font-bold text-red-600">{reqMetrics.criticalRequests} CRITICAL</span> and{' '}
              <span className="font-bold text-amber-700">{reqMetrics.highRequests} HIGH</span> urgency blood requests requiring donor coordination.
            </div>
          </div>
          <Link to="/admin/requests?urgency=CRITICAL">
            <Button size="sm" variant="outline" className="bg-white border-red-200 hover:bg-red-50 text-red-700 text-xs">
              View Critical →
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Donors"
          value={metrics.totalDonors}
          subtitle="Registered in database"
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Eligible Donors"
          value={metrics.eligibleDonors}
          subtitle={`${Math.round((metrics.eligibleDonors / (metrics.totalDonors || 1)) * 100)}% currently eligible`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Recent Collections (30d)"
          value={metrics.recentDonationsCount}
          subtitle="Procedures completed"
          icon={Activity}
          color="crimson"
        />

        <StatCard
          title="Open Blood Requests"
          value={reqMetrics?.openRequests ?? 0}
          subtitle={`${reqMetrics?.partiallyFulfilledRequests ?? 0} in partial fulfillment`}
          icon={HeartPulse}
          color="amber"
        />
      </div>

      {/* Blood Requests Status Summary Grid */}
      {reqMetrics && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-crimson-600" />
              Blood Request Coordination Pipeline
            </h2>
            <Link to="/admin/requests" className="text-xs font-semibold text-crimson-600 hover:text-crimson-700">
              Manage All Requests →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-2xs font-semibold text-blue-700 uppercase">Open Requests</span>
              <div className="text-xl font-bold text-blue-900 mt-1">{reqMetrics.openRequests}</div>
            </div>

            <div className="p-3 rounded-xl bg-red-50/60 border border-red-100">
              <span className="text-2xs font-semibold text-red-700 uppercase">Critical Urgency</span>
              <div className="text-xl font-bold text-red-900 mt-1">{reqMetrics.criticalRequests}</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="text-2xs font-semibold text-amber-700 uppercase">High Urgency</span>
              <div className="text-xl font-bold text-amber-900 mt-1">{reqMetrics.highRequests}</div>
            </div>

            <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100">
              <span className="text-2xs font-semibold text-orange-700 uppercase">Partial Filled</span>
              <div className="text-xl font-bold text-orange-900 mt-1">{reqMetrics.partiallyFulfilledRequests}</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-2xs font-semibold text-emerald-700 uppercase">Fulfilled Today</span>
              <div className="text-xl font-bold text-emerald-900 mt-1">{reqMetrics.fulfilledTodayRequests}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-2xs font-semibold text-slate-600 uppercase">Expired / Overdue</span>
              <div className="text-xl font-bold text-slate-800 mt-1">{reqMetrics.expiredRequests}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Blood Group Distribution & Recent Procedures Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Blood Group Distribution */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplet className="w-4 h-4 text-crimson-600" />
                Active Donors by Blood Group
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {bloodGroupList.map((bg) => {
                  const count = metrics.bloodGroupDistribution[bg] || 0;
                  const percentage =
                    metrics.totalDonors > 0 ? Math.round((count / metrics.totalDonors) * 100) : 0;

                  return (
                    <div
                      key={bg}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <BloodGroupBadge bloodGroup={bg} />
                        <span className="text-2xs font-bold text-slate-400">{percentage}%</span>
                      </div>
                      <div>
                        <div className="text-lg font-black text-slate-900">{count}</div>
                        <p className="text-2xs text-slate-500 font-medium">registered donor{count === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Collections */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-crimson-600" />
                  Recent Clinical Collections
                </CardTitle>
                <Link
                  to="/admin/donors"
                  className="text-xs font-semibold text-crimson-600 hover:text-crimson-700"
                >
                  View All →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {metrics.recentDonations.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-500">
                  No recent blood donation procedures recorded.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {metrics.recentDonations.map((donation) => (
                    <div key={donation.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {donation.donor.fullName}
                          </span>
                          <BloodGroupBadge bloodGroup={donation.donor.bloodGroup} />
                        </div>
                        <p className="text-2xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-crimson-500" />
                          {donation.location}
                        </p>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="font-medium text-slate-700 flex items-center gap-1 text-2xs">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(donation.donatedAt)}
                        </span>
                        {donation.notes && (
                          <span className="text-2xs text-slate-400 block max-w-xs truncate">
                            {donation.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
