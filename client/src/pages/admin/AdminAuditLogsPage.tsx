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
      return 'bg-[#FEF2F2] text-[#B42318] border-[#FEE2E2]';
    }
    if (action.includes('RECORD') || action.includes('ACCEPTED') || action.includes('REGISTER')) {
      return 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]';
    }
    if (action.includes('DISPATCH') || action.includes('CREATED') || action.includes('LOGIN')) {
      return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]';
    }
    return 'bg-[#FAF9F7] text-[#667085] border-[#E7E5E4]';
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-[#D92D45] shrink-0" />
              Security & Audit Logs
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF5FF] text-[#7E22CE] border border-[#F3E8FF] uppercase tracking-wider">
              Immutable Trail
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Review security events, coordinator clinical decisions, and administrative actions with correlation tracking.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl text-[#1F2937] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D92D45]/20 focus:border-[#D92D45] transition"
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
            <Activity className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl text-[#1F2937] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D92D45]/20 focus:border-[#D92D45] transition"
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
            className="px-4 py-2.5 text-xs font-bold text-[#D92D45] hover:text-[#B42318] bg-[#FFF0F2] hover:bg-[#FFE4E8] rounded-xl transition cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[#667085] text-xs">
            Loading secure audit trail records...
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="p-12 text-center text-[#667085] space-y-2">
            <ShieldAlert className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <p className="font-semibold">No audit events match current criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-[#667085] min-w-[960px]">
              <thead className="bg-[#FAF9F7] text-[#1F2937] font-bold border-b border-[#E7E5E4] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">Timestamp</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">Action</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">Actor</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">Target Resource</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Details Snapshot</th>
                  <th className="py-3.5 px-4 text-right pr-6 whitespace-nowrap min-w-[100px]">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]/60">
                {data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF9F7] transition-colors font-mono">
                    <td className="py-3.5 px-4 text-[#667085] text-2xs whitespace-nowrap">
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
                    <td className="py-3.5 px-4 text-[#1F2937] font-semibold font-sans">
                      {log.actorUserId ? (
                        <div>
                          <span className="font-mono text-2xs font-bold text-[#1F2937] truncate block max-w-[140px]">
                            {log.actorUserId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF] italic">SYSTEM</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.targetType ? (
                        <div>
                          <span className="font-bold text-[#1F2937]">{log.targetType}</span>
                          {log.targetId && (
                            <span className="text-[10px] text-[#667085] font-mono block truncate max-w-[120px]">
                              {log.targetId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#667085] font-sans text-2xs max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap min-w-[100px]">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#1F2937] bg-[#FAF9F7] hover:bg-[#F5F5F4] border border-[#E7E5E4] transition font-sans text-xs font-semibold cursor-pointer"
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
          <div className="p-4 border-t border-[#E7E5E4] flex items-center justify-between text-xs text-[#667085] font-mono">
            <div>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total events)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E7E5E4] hover:bg-[#FAF9F7] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-[#E7E5E4] hover:bg-[#FAF9F7] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E5E4] max-w-2xl w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-[#D92D45]" />
                <h3 className="text-base font-bold text-[#1F2937]">Audit Event Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-[#667085] hover:text-[#1F2937] rounded-lg hover:bg-[#FAF9F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF9F7] rounded-xl border border-[#E7E5E4]">
                <span className="text-[#667085] block">Event Action</span>
                <span className="font-mono font-bold text-[#1F2937]">{selectedLog.action}</span>
              </div>
              <div className="p-3 bg-[#FAF9F7] rounded-xl border border-[#E7E5E4]">
                <span className="text-[#667085] block">Timestamp</span>
                <span className="font-mono text-[#1F2937]">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-[#1F2937] block mb-1">Payload Metadata</span>
              <pre className="p-3 bg-[#FAF9F7] rounded-xl border border-[#E7E5E4] text-2xs font-mono text-[#1F2937] overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#FAF9F7] hover:bg-[#F5F5F4] text-[#1F2937] border border-[#E7E5E4] rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
