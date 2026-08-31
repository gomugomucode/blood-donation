import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Server,
  Database,
  Mail,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { formatDate } from '../../lib/utils.js';
import { Button } from '../../components/common/Button.js';
import { BloodGroupBadge } from '../../components/common/Badge.js';

export const AdminOperationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch live system status
  const {
    data: systemStatus,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['admin-operations-system-status'],
    queryFn: () => adminService.getSystemStatus(),
    refetchInterval: 10000,
  });

  // 2. Fetch operational notifications
  const {
    data: notifData,
    isLoading: isNotifLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['admin-operations-notifications', page, statusFilter, channelFilter],
    queryFn: () =>
      adminService.getOperationalNotifications({
        page,
        limit: 10,
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
      }),
    refetchInterval: 10000,
  });

  // 3. Retry mutation
  const retryMutation = useMutation({
    mutationFn: (id: string) => adminService.retryOperationalNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-operations-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-operations-system-status'] });
      setActionMessage({ type: 'success', text: 'Notification retry initiated successfully.' });
      setTimeout(() => setActionMessage(null), 4000);
    },
    onError: (err: any) => {
      setActionMessage({ type: 'error', text: err.message || 'Failed to retry notification.' });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-2xs font-bold font-mono">SENT</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-2xs font-bold font-mono">PENDING</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-2xs font-bold font-mono">FAILED</span>;
      case 'READ':
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-2xs font-bold font-mono">READ</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-2xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-8 h-8 text-rose-600 shrink-0" />
              Operations & Infrastructure
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Monitor real-time component health, background notification queue depth, and external provider dispatch.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchStatus();
            refetchNotifications();
          }}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          role="alert"
          className={`flex items-center gap-2 p-3.5 text-xs font-semibold rounded-2xl border animate-fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Component Health & Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Component */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold uppercase tracking-wider">
              {systemStatus?.components.database.status || 'CHECKING'}
            </span>
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">PostgreSQL Primary</h2>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
              {systemStatus?.components.database.latencyMs !== undefined ? `${systemStatus.components.database.latencyMs}ms latency` : '—'}
            </div>
            <p className="text-2xs text-slate-400 mt-1">Connection pool active & responsive</p>
          </div>
        </div>

        {/* Notification Worker */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold uppercase tracking-wider">
              {systemStatus?.components.notificationWorker.status || 'IDLE'}
            </span>
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Background Worker</h2>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
              {systemStatus?.components.notificationWorker.pollIntervalMs !== undefined
                ? `${systemStatus.components.notificationWorker.pollIntervalMs / 1000}s interval`
                : 'Active'}
            </div>
            <p className="text-2xs text-slate-400 mt-1">Transaction-safe database queue consumer</p>
          </div>
        </div>

        {/* Email Provider */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-extrabold uppercase tracking-wider">
              {systemStatus?.components.emailProvider.provider || 'mock'}
            </span>
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Gateway</h2>
            <div className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              {systemStatus?.components.emailProvider.fromEmail || 'alerts@blooddonation.org'}
            </div>
            <p className="text-2xs text-slate-400 mt-1">Status: {systemStatus?.components.emailProvider.status}</p>
          </div>
        </div>

        {/* SMS Provider */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold uppercase tracking-wider">
              {systemStatus?.components.smsProvider.provider || 'mock'}
            </span>
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telecom SMS Gateway</h2>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
              {systemStatus?.components.smsProvider.status || 'CONFIGURED'}
            </div>
            <p className="text-2xs text-slate-400 mt-1">Provider: {systemStatus?.components.smsProvider.provider}</p>
          </div>
        </div>
      </div>

      {/* Queue Metrics Summary Bar */}
      {systemStatus?.queueMetrics && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Notification Queue Telemetry</h2>
            <p className="text-2xs text-slate-500">Live delivery metrics and dead-letter queue tracking</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left font-mono">
              <span className="text-2xs text-slate-400 font-sans block">Queued (Pending)</span>
              <span className="text-xl font-extrabold text-blue-600">{systemStatus.queueMetrics.pending}</span>
            </div>
            <div className="text-left font-mono">
              <span className="text-2xs text-slate-400 font-sans block">Dispatched (Sent)</span>
              <span className="text-xl font-extrabold text-emerald-600">{systemStatus.queueMetrics.sent}</span>
            </div>
            <div className="text-left font-mono">
              <span className="text-2xs text-slate-400 font-sans block">Delivery Failures</span>
              <span className="text-xl font-extrabold text-rose-600">{systemStatus.queueMetrics.failed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notification Delivery Feed & Retry Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Outreach Notification Delivery Audit</h2>
            <p className="text-2xs text-slate-500">Inspect external message delivery logs, error codes, and trigger manual retry</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="FAILED">FAILED Only</option>
              <option value="PENDING">PENDING</option>
              <option value="SENT">SENT</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Channels</option>
              <option value="EMAIL">EMAIL</option>
              <option value="SMS">SMS</option>
              <option value="IN_APP">IN_APP</option>
            </select>
          </div>
        </div>

        {isNotifLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading delivery telemetry...</div>
        ) : !notifData?.items || notifData.items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No notification records matched current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Attempts</th>
                  <th className="py-3.5 px-4">Error Diagnostics</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {notifData.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {item.user?.donorProfile?.fullName || item.user?.email || item.userId}
                        </span>
                        {item.user?.donorProfile?.bloodGroup && (
                          <div className="mt-1">
                            <BloodGroupBadge bloodGroup={item.user.donorProfile.bloodGroup as any} size="sm" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {item.channel}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-bold">
                      {item.attemptCount} / 3
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-2xs text-rose-600 font-mono">
                      {item.errorCode || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-2xs text-slate-400 font-mono whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {item.status === 'FAILED' && item.attemptCount < 3 && (
                        <button
                          onClick={() => retryMutation.mutate(item.id)}
                          disabled={retryMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
