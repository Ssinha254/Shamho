import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '../services/transactions.service';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsService.getTransactions(),
  });
};

export const useTransactionsByMember = (memberId: string) => {
  return useQuery({
    queryKey: ['transactions', memberId],
    queryFn: () => transactionsService.getTransactionsByMember(memberId),
    enabled: !!memberId,
  });
};

export const useTransactionsByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['transactions', startDate, endDate],
    queryFn: () => transactionsService.getTransactionsByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionData) => transactionsService.createTransaction(transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useTransactionById = (id: string) => {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => transactionsService.getTransactionById(id),
    enabled: !!id,
  });
};
