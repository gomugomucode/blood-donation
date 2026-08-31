import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Filter,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileJson,
} from 'lucide-react';
import { adminService, AuditLog } from '../../services/admin.service.js';
import { formatDate } from '../../lib/utils.js';

export const AdminAuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter, targetTypeFilter],
    queryFn: () =>
      adminService.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter || undefined,
        targetType: targetTypeFilter || undefined,
      }),
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CANCEL') || action.includes('DEACTIVAT') || action.includes('FAILED')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('RECORD') || action.includes('ACCEPTED') || action.includes('REGISTER')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('DISPATCH') || action.includes('CREATED') || action.includes('LOGIN')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />
              Security & Audit Logs
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
              Immutable Trail
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review security events, coordinator clinical decisions, and administrative actions with correlation tracking.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition"
            >
              <option value="">All Security Actions</option>
              <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
              <option value="DONOR_REGISTER">DONOR_REGISTER</option>
              <option value="DONOR_MODIFIED">DONOR_MODIFIED</option>
              <option value="DONOR_DEACTIVATED">DONOR_DEACTIVATED</option>
              <option value="OPPORTUNITY_CREATED">OPPORTUNITY_CREATED</option>
              <option value="OPPORTUNITY_VIEWED">OPPORTUNITY_VIEWED</option>
              <option value="OPPORTUNITY_ACCEPTED">OPPORTUNITY_ACCEPTED</option>
              <option value="OPPORTUNITY_DECLINED">OPPORTUNITY_DECLINED</option>
              <option value="OPPORTUNITY_CANCELLED">OPPORTUNITY_CANCELLED</option>
              <option value="NOTIFICATION_DISPATCHED">NOTIFICATION_DISPATCHED</option>
              <option value="DONATION_RECORDED">DONATION_RECORDED</option>
              <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
              <option value="PASSWORD_RESET_REQUESTED">PASSWORD_RESET_REQUESTED</option>
              <option value="PASSWORD_RESET_COMPLETED">PASSWORD_RESET_COMPLETED</option>
            </select>
          </div>

          <div className="relative">
            <Activity className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition"
            >
              <option value="">All Target Resources</option>
              <option value="USER">USER</option>
              <option value="DONOR_PROFILE">DONOR_PROFILE</option>
              <option value="BLOOD_REQUEST">BLOOD_REQUEST</option>
              <option value="DONOR_OPPORTUNITY">DONOR_OPPORTUNITY</option>
              <option value="DONATION">DONATION</option>
              <option value="NOTIFICATION">NOTIFICATION</option>
            </select>
          </div>
        </div>

        {(actionFilter || targetTypeFilter) && (
          <button
            onClick={() => {
              setActionFilter('');
              setTargetTypeFilter('');
              setPage(1);
            }}
            className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading secure audit trail records...
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold">No audit events match current criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4">Details Snapshot</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors font-mono">
                    <td className="py-3.5 px-4 text-slate-500 text-2xs whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold font-sans">
                      {log.user ? (
                        <div>
                          <span>{log.user.email}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {log.user.role}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">SYSTEM</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.targetType ? (
                        <div>
                          <span className="font-bold text-slate-800">{log.targetType}</span>
                          {log.targetId && (
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[120px]">
                              {log.targetId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-sans text-2xs max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition font-sans text-xs font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
            <div>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalItems} total events)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Structured JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-elevated border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Audit Event Snapshot: {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-mono text-2xs">
                <div>
                  <span className="text-slate-400 block font-sans">Event ID</span>
                  <span className="text-slate-900 font-bold">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Timestamp</span>
                  <span className="text-slate-900 font-bold">{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Actor</span>
                  <span className="text-slate-900 font-bold">
                    {selectedLog.user ? `${selectedLog.user.email} (${selectedLog.user.role})` : 'SYSTEM'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Target Resource</span>
                  <span className="text-slate-900 font-bold">
                    {selectedLog.targetType || 'N/A'}: {selectedLog.targetId || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1 font-sans">
                  Structured Payload Data:
                </span>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
