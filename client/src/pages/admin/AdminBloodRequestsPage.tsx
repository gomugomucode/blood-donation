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
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight flex items-center gap-2.5">
            <HeartPulse className="w-8 h-8 text-[#D92D45] shrink-0" />
            Blood Requests & Coordination
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#667085]">
            Create, monitor, and coordinate matched voluntary donor outreach for clinical hospital blood requests.
          </p>
        </div>
        <Link to="/admin/requests/create">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            New Blood Request
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-card space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1F2937] pb-1">
          <Filter className="w-4 h-4 text-[#667085]" />
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
              leftIcon={<Search className="w-4 h-4 text-[#9CA3AF]" />}
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
          <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between text-xs text-[#667085]">
            <span>Filtered results active</span>
            <button
              onClick={handleResetFilters}
              className="text-[#D92D45] hover:text-[#B42318] font-bold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E7E5E4] shadow-card flex justify-center items-center">
          <LoadingSpinner size="lg" label="Loading blood requests..." />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl p-8 border border-[#E7E5E4] shadow-card">
          <ErrorState
            title="Failed to load blood requests"
            message={(error as Error)?.message || 'An unexpected error occurred while fetching requests.'}
            onRetry={() => refetch()}
          />
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E7E5E4] shadow-card">
          <EmptyState
            title="No blood requests found"
            description="There are currently no blood requests matching your search or filter parameters."
            action={
              <Link to="/admin/requests/create">
                <Button variant="primary" size="sm">
                  Create Request
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-[#667085] min-w-[1040px]">
              <thead className="bg-[#FAF9F7] border-b border-[#E7E5E4] uppercase tracking-wider font-bold text-[#1F2937] text-[11px]">
                <tr>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[150px]">Blood Group</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[160px]">Fulfillment Progress</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Urgency</th>
                  <th className="py-4 px-4 min-w-[220px]">Hospital & Location</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Needed By</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Status</th>
                  <th className="py-4 px-4 text-right pr-6 whitespace-nowrap min-w-[180px]">Coordination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]/60">
                {data.items.map((req) => {
                  const percentage = Math.min(
                    100,
                    Math.round((req.unitsFulfilled / req.unitsRequired) * 100)
                  );
                  const isOverdue = new Date(req.requiredBy) < new Date() && req.status === 'OPEN';

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-[#FAF9F7] transition-colors group"
                    >
                      <td className="py-4 px-4 font-bold text-[#1F2937] whitespace-nowrap min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <BloodGroupBadge bloodGroup={req.bloodGroup} />
                          {req.patientReference && (
                            <span className="text-2xs text-[#667085] font-mono bg-[#FAF9F7] px-2 py-0.5 rounded-md border border-[#E7E5E4] whitespace-nowrap font-semibold">
                              #{req.patientReference}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 min-w-[160px]">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-[#1F2937]">
                              {req.unitsFulfilled} / {req.unitsRequired} Units
                            </span>
                            <span className="text-[#667085] font-semibold">{percentage}%</span>
                          </div>
                          <div className="w-full bg-[#FAF9F7] border border-[#E7E5E4] rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                req.status === 'FULFILLED'
                                  ? 'bg-[#15803D]'
                                  : percentage > 0
                                  ? 'bg-[#B45309]'
                                  : 'bg-[#D92D45]'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        <RequestUrgencyBadge urgency={req.urgency} />
                      </td>

                      <td className="py-4 px-4 min-w-[220px]">
                        <div className="space-y-0.5">
                          <div className="font-bold text-[#1F2937] flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#D92D45] shrink-0" />
                            <span className="truncate max-w-[200px]">{req.hospitalName}</span>
                          </div>
                          <div className="text-2xs text-[#667085] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                            <span className="truncate max-w-[200px]">{req.location}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap font-mono min-w-[130px]">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <span className={isOverdue ? 'text-[#B42318] font-bold' : 'text-[#1F2937] font-semibold'}>
                            {formatDate(req.requiredBy)}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        <RequestStatusBadge status={req.status} />
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap pr-6 min-w-[180px]">
                        <Link to={`/admin/requests/${req.id}`}>
                          <Button variant="outline" size="sm" rightIcon={<Sparkles className="w-3.5 h-3.5 text-[#B45309]" />}>
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
          <div className="block lg:hidden divide-y divide-[#E7E5E4]/60">
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
                    <h3 className="font-bold text-[#1F2937] text-sm">{req.hospitalName}</h3>
                    <p className="text-2xs text-[#667085] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D92D45]" />
                      {req.location}
                    </p>
                  </div>

                  <div className="space-y-1 bg-[#FAF9F7] p-3 rounded-xl border border-[#E7E5E4] font-mono text-xs">
                    <div className="flex justify-between font-bold text-[#1F2937]">
                      <span>Fulfillment: {req.unitsFulfilled} / {req.unitsRequired} Units</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full bg-[#E7E5E4] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#D92D45] rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-2xs text-[#667085] font-mono">
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
            <div className="p-4 border-t border-[#E7E5E4]">
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
