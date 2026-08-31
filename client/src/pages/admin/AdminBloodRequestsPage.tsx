import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, AlertCircle, Building2, MapPin, Calendar, HeartPulse } from 'lucide-react';
import { useBloodRequests } from '../../hooks/useBloodRequests.js';
import { BloodGroup } from '../../types/index.js';
import { RequestStatus, RequestUrgency } from '../../types/blood-request.js';
import {
  BloodGroupBadge,
  RequestStatusBadge,
  RequestUrgencyBadge,
} from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-crimson-600" />
            Blood Requests & Coordination
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, track, and match clinical blood requests with screened donor candidates.
          </p>
        </div>
        <Link to="/admin/requests/create">
          <Button variant="primary" className="shadow-md shadow-crimson-600/20">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Blood Request
          </Button>
        </Link>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Basic Screening Notice: </span>
          The donor matching engine provides application-level compatibility screening. All final donor eligibility and blood safety verification must be confirmed through certified medical assessment and blood-bank crossmatching procedures.
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search hospital, city, or patient ref..."
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
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Filtered results</span>
            <button
              onClick={handleResetFilters}
              className="text-crimson-600 hover:text-crimson-700 font-medium cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </Card>

      {/* Main Table Content */}
      {isLoading ? (
        <Card className="p-12 flex justify-center items-center">
          <LoadingSpinner size="lg" text="Loading blood requests..." />
        </Card>
      ) : isError ? (
        <Card className="p-8">
          <ErrorState
            title="Failed to load blood requests"
            description={(error as Error)?.message || 'An unexpected error occurred while fetching requests.'}
            onRetry={() => refetch()}
          />
        </Card>
      ) : !data?.items || data.items.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No blood requests found"
            description="There are currently no blood requests matching your search or filter parameters."
            actionText="Create Request"
            onAction={() => window.location.assign('/admin/requests/create')}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Blood Group</th>
                  <th className="py-3.5 px-4">Fulfillment Progress</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Hospital & Location</th>
                  <th className="py-3.5 px-4">Required By</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
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
                      <td className="py-4 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <BloodGroupBadge bloodGroup={req.bloodGroup} />
                          {req.patientReference && (
                            <span className="text-xs text-slate-400 font-mono">
                              #{req.patientReference}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {req.unitsFulfilled} / {req.unitsRequired} Units
                            </span>
                            <span className="text-slate-400 font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                req.status === 'FULFILLED'
                                  ? 'bg-emerald-500'
                                  : percentage > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <RequestUrgencyBadge urgency={req.urgency} />
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{req.hospitalName}</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{req.location}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-700'}>
                            {formatDate(req.requiredBy)}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <RequestStatusBadge status={req.status} />
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link to={`/admin/requests/${req.id}`}>
                          <Button variant="outline" size="sm" className="hover:border-crimson-300 hover:text-crimson-700">
                            View & Match
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={data.pagination.page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
