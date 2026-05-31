import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../services/ai.service';

export const useAIRecords = () => {
  return useQuery({
    queryKey: ['ai-records'],
    queryFn: () => aiService.getAIRecords(),
  });
};

export const useAIRecordsByMember = (memberId: string) => {
  return useQuery({
    queryKey: ['ai-records', memberId],
    queryFn: () => aiService.getAIRecordsByMember(memberId),
    enabled: !!memberId,
  });
};

export const useCreateAIRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordData) => aiService.createAIRecord(recordData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-records'] });
    },
  });
};

export const useUpdateAIRecordStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, status }: { recordId: string; status: 'PENDING' | 'POSITIVE' | 'NEGATIVE' }) =>
      aiService.updateAIRecordStatus(recordId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-records'] });
    },
  });
};

export const useConceptionRate = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['ai-records', 'conception-rate', startDate, endDate],
    queryFn: () => aiService.getConceptionRate(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};
