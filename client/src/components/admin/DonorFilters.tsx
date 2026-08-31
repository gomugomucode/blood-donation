import React from 'react';
import { Search, X } from 'lucide-react';
import { BloodGroup, DonorFilters as DonorFiltersType } from '../../types/index.js';
import { bloodGroups } from '../../schemas/auth.schema.js';
import { formatBloodGroup } from '../../lib/utils.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { Button } from '../common/Button.js';

export interface DonorFiltersProps {
  filters: DonorFiltersType;
  onChange: (newFilters: DonorFiltersType) => void;
  onReset: () => void;
}

export const DonorFilters: React.FC<DonorFiltersProps> = ({ filters, onChange, onReset }) => {
  const bloodGroupOptions = [
    { value: '', label: 'All Blood Groups' },
    ...bloodGroups.map((bg) => ({
      value: bg,
      label: `${formatBloodGroup(bg)} (${bg.replace('_', ' ')})`,
    })),
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value, page: 1 });
  };

  const handleBloodGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      bloodGroup: (e.target.value as BloodGroup) || '',
      page: 1,
    });
  };

  const handleDeactivatedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      includeDeactivated: e.target.checked,
      page: 1,
    });
  };

  const hasActiveFilters = Boolean(filters.search || filters.bloodGroup || filters.includeDeactivated);

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* Search */}
        <div className="sm:col-span-6">
          <Input
            label="Search Donors"
            placeholder="Search by name, email, phone, or location..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Blood Group Filter */}
        <div className="sm:col-span-4">
          <Select
            label="Blood Group Filter"
            value={filters.bloodGroup || ''}
            onChange={handleBloodGroupChange}
            options={bloodGroupOptions}
          />
        </div>

        {/* Clear Filters Button */}
        <div className="sm:col-span-2 flex items-end">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="w-full text-slate-500 hover:text-slate-800"
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Include Deactivated Toggle */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="include-deactivated"
          checked={Boolean(filters.includeDeactivated)}
          onChange={handleDeactivatedChange}
          className="w-4 h-4 text-crimson-600 rounded border-slate-300 focus:ring-crimson-500 cursor-pointer"
        />
        <label htmlFor="include-deactivated" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
          Include deactivated/archived donor accounts
        </label>
      </div>
    </div>
  );
};
