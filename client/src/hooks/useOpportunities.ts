import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunityService } from '../services/opportunity.service.js';
import { OpportunityStatus, DeclineOpportunityPayload } from '../types/opportunity.js';

export const useDonorOpportunities = (params?: {
  page?: number;
  limit?: number;
  status?: OpportunityStatus;
}) => {
  return useQuery({
    queryKey: ['donor-opportunities', params],
    queryFn: () => opportunityService.getMyOpportunities(params),
  });
};

export const useDonorOpportunity = (id?: string) => {
  return useQuery({
    queryKey: ['donor-opportunity', id],
    queryFn: () => (id ? opportunityService.getMyOpportunityById(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
  });
};

export const useAcceptOpportunity = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => opportunityService.acceptOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donor-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['donor-opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] });
    },
  });
};

export const useDeclineOpportunity = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeclineOpportunityPayload) =>
      opportunityService.declineOpportunity(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donor-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['donor-opportunity', id] });
    },
  });
};

export const useBloodRequestOutreach = (bloodRequestId?: string) => {
  return useQuery({
    queryKey: ['blood-request-outreach', bloodRequestId],
    queryFn: () =>
      bloodRequestId
        ? opportunityService.getOutreachForBloodRequest(bloodRequestId)
        : Promise.reject('No ID'),
    enabled: Boolean(bloodRequestId),
  });
};

export const useCreateOpportunitiesBatch = (bloodRequestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (donorIds: string[]) =>
      opportunityService.createOpportunitiesBatch(bloodRequestId, { donorIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-request-outreach', bloodRequestId] });
      queryClient.invalidateQueries({ queryKey: ['blood-request', bloodRequestId] });
      queryClient.invalidateQueries({ queryKey: ['blood-request-matches', bloodRequestId] });
    },
  });
};

export const useCancelOpportunity = (bloodRequestId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      opportunityService.cancelOpportunity(id, reason),
    onSuccess: () => {
      if (bloodRequestId) {
        queryClient.invalidateQueries({ queryKey: ['blood-request-outreach', bloodRequestId] });
      }
      queryClient.invalidateQueries({ queryKey: ['donor-opportunities'] });
    },
  });
};
