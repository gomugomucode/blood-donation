import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, MapPin, Calendar, HeartPulse, Sparkles, Filter } from 'lucide-react';
import { useBloodRequests } from '../../hooks/useBloodRequests.js';
import { BloodGroup } from '../../types/index.js';
import { RequestStatus, RequestUrgency } from '../../types/blood-request.js';
import {
  BloodGroupBadge,
  RequestStatusBadge,
  RequestUrgencyBadge,
} from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { formatDate } from '../../lib/utils.js';

export const AdminBloodRequestsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [urgency, setUrgency] = useState<RequestUrgency | ''>('');

  const { data, isLoading, isError, error, refetch } = useBloodRequests({
    page,
    limit: 10,
    search: search || undefined,
    status: (status as RequestStatus) || undefined,
    bloodGroup: (bloodGroup as BloodGroup) || undefined,
    urgency: (urgency as RequestUrgency) || undefined,
  });

  const bloodGroupOptions = [
    { value: '', label: 'All Blood Groups' },
    { value: 'A_POSITIVE', label: 'A+' },
    { value: 'A_NEGATIVE', label: 'A-' },
    { value: 'B_POSITIVE', label: 'B+' },
    { value: 'B_NEGATIVE', label: 'B-' },
    { value: 'AB_POSITIVE', label: 'AB+' },
    { value: 'AB_NEGATIVE', label: 'AB-' },
    { value: 'O_POSITIVE', label: 'O+' },
    { value: 'O_NEGATIVE', label: 'O-' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'OPEN', label: 'Open' },
    { value: 'PARTIALLY_FULFILLED', label: 'Partially Fulfilled' },
    { value: 'FULFILLED', label: 'Fulfilled' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'EXPIRED', label: 'Expired' },
  ];

  const urgencyOptions = [
    { value: '', label: 'All Urgencies' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'LOW', label: 'Low' },
  ];

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setBloodGroup('');
    setUrgency('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <HeartPulse className="w-8 h-8 text-rose-600 shrink-0" />
            Blood Requests & Coordination
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Create, monitor, and coordinate matched voluntary donor outreach for clinical hospital blood requests.
          </p>
        </div>
        <Link to="/admin/requests/create">
          <Button variant="critical" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            New Blood Request
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-1">
          <Filter className="w-4 h-4 text-slate-400" />
          Filter & Search Blood Requests
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search hospital, region, or patient ref..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div>
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as RequestStatus);
                setPage(1);
              }}
            />
          </div>

          <div>
            <Select
              options={urgencyOptions}
              value={urgency}
              onChange={(e) => {
                setUrgency(e.target.value as RequestUrgency);
                setPage(1);
              }}
            />
          </div>

          <div>
            <Select
              options={bloodGroupOptions}
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value as BloodGroup);
                setPage(1);
              }}
            />
          </div>
        </div>

        {(search || status || bloodGroup || urgency) && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Filtered results active</span>
            <button
              onClick={handleResetFilters}
              className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-card flex justify-center items-center">
          <LoadingSpinner size="lg" label="Loading blood requests..." />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card">
          <ErrorState
            title="Failed to load blood requests"
            message={(error as Error)?.message || 'An unexpected error occurred while fetching requests.'}
            onRetry={() => refetch()}
          />
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-card">
          <EmptyState
            title="No blood requests found"
            description="There are currently no blood requests matching your search or filter parameters."
            action={
              <Link to="/admin/requests/create">
                <Button variant="critical" size="sm">
                  Create Request
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider font-bold text-slate-700 text-[11px]">
                <tr>
                  <th className="py-4 px-6">Blood Group</th>
                  <th className="py-4 px-6">Fulfillment Progress</th>
                  <th className="py-4 px-6">Urgency</th>
                  <th className="py-4 px-6">Hospital & Location</th>
                  <th className="py-4 px-6">Needed By</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Coordination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((req) => {
                  const percentage = Math.min(
                    100,
                    Math.round((req.unitsFulfilled / req.unitsRequired) * 100)
                  );
                  const isOverdue = new Date(req.requiredBy) < new Date() && req.status === 'OPEN';

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <BloodGroupBadge bloodGroup={req.bloodGroup} />
                          {req.patientReference && (
                            <span className="text-2xs text-slate-400 font-mono">
                              #{req.patientReference}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-slate-900">
                              {req.unitsFulfilled} / {req.unitsRequired} Units
                            </span>
                            <span className="text-slate-500 font-semibold">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                req.status === 'FULFILLED'
                                  ? 'bg-emerald-500'
                                  : percentage > 0
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <RequestUrgencyBadge urgency={req.urgency} />
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate max-w-[200px]">{req.hospitalName}</span>
                          </div>
                          <div className="text-2xs text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{req.location}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-700 font-semibold'}>
                            {formatDate(req.requiredBy)}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <RequestStatusBadge status={req.status} />
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Link to={`/admin/requests/${req.id}`}>
                          <Button variant="outline" size="sm" rightIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}>
                            Match & Outreach
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {data.items.map((req) => {
              const percentage = Math.min(
                100,
                Math.round((req.unitsFulfilled / req.unitsRequired) * 100)
              );

              return (
                <div key={req.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BloodGroupBadge bloodGroup={req.bloodGroup} />
                      <RequestUrgencyBadge urgency={req.urgency} />
                    </div>
                    <RequestStatusBadge status={req.status} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{req.hospitalName}</h3>
                    <p className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {req.location}
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Fulfillment: {req.unitsFulfilled} / {req.unitsRequired} Units</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-2xs text-slate-500 font-mono">
                      Needed: {formatDate(req.requiredBy)}
                    </span>
                    <Link to={`/admin/requests/${req.id}`}>
                      <Button variant="primary" size="sm">
                        Match Candidates →
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                pagination={data.pagination}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
