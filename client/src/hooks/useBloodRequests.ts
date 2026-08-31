import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodRequestService } from '../services/blood-request.service.js';
import {
  BloodRequestFilters,
  CreateBloodRequestInput,
  UpdateBloodRequestInput,
} from '../types/blood-request.js';

export const useBloodRequests = (filters: BloodRequestFilters = {}) => {
  return useQuery({
    queryKey: ['blood-requests', filters],
    queryFn: () => bloodRequestService.getBloodRequests(filters),
    placeholderData: (previousData) => previousData,
  });
};

export const useBloodRequest = (id?: string) => {
  return useQuery({
    queryKey: ['blood-request', id],
    queryFn: () => bloodRequestService.getBloodRequestById(id!),
    enabled: !!id,
  });
};

export const useBloodRequestMatches = (id?: string) => {
  return useQuery({
    queryKey: ['blood-request-matches', id],
    queryFn: () => bloodRequestService.getMatches(id!),
    enabled: !!id,
  });
};

export const useCreateBloodRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBloodRequestInput) =>
      bloodRequestService.createBloodRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

export const useUpdateBloodRequest = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBloodRequestInput) =>
      bloodRequestService.updateBloodRequest(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['blood-request', id] });
      queryClient.invalidateQueries({ queryKey: ['blood-request-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

export const useCancelBloodRequest = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => bloodRequestService.cancelBloodRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['blood-request', id] });
      queryClient.invalidateQueries({ queryKey: ['blood-request-matches', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

export const useNotifyDonorCandidate = (requestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      donorId,
      channel,
      message,
    }: {
      donorId: string;
      channel?: 'SMS' | 'EMAIL' | 'IN_APP';
      message?: string;
    }) => bloodRequestService.notifyCandidate(requestId, donorId, channel, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-request-matches', requestId] });
    },
  });
};
