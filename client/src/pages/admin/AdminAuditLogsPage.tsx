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
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('RECORD') || action.includes('ACCEPTED') || action.includes('REGISTER')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('DISPATCH') || action.includes('CREATED') || action.includes('LOGIN')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Audit Logs</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              Immutable Audit Trail
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Review security events, coordinator clinical decisions, and administrative actions.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition"
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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition"
            >
              <option value="">All Target Entities</option>
              <option value="User">User</option>
              <option value="DonorProfile">DonorProfile</option>
              <option value="BloodRequest">BloodRequest</option>
              <option value="DonorOpportunity">DonorOpportunity</option>
              <option value="Notification">Notification</option>
              <option value="Donation">Donation</option>
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
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-slate-300 border-t-rose-600 rounded-full mb-2"></div>
            <div>Loading security audit records...</div>
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-900">No audit records found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Type</th>
                    <th className="py-3 px-4">Target ID</th>
                    <th className="py-3 px-4">Actor ID</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {data.items.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-sans">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-sans font-medium">
                        {log.targetType}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.targetId ? log.targetId.substring(0, 8) + '...' : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.actorUserId ? log.actorUserId.substring(0, 8) + '...' : 'System'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-sans text-xs transition"
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

            {/* Pagination Controls */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600 font-sans">
                <div>
                  Showing Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} records)
                </div>
                <div className="flex gap-1.5">
                  <button
                    disabled={!data.pagination.hasPrevPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>
                  <button
                    disabled={!data.pagination.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 transition flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Audit Event Snapshot</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Action</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedLog.action}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Target Type</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedLog.targetType}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Timestamp</div>
                  <div className="text-slate-800 mt-0.5">{formatDate(selectedLog.createdAt)}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Actor ID</div>
                  <div className="font-mono text-slate-700 mt-0.5 break-all">
                    {selectedLog.actorUserId || 'System / Automated'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-slate-600 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                  Event Metadata Payload:
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="text-[11px] text-slate-500 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                Audit logs are cryptographically immutable and permanently retained for compliance.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition"
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
