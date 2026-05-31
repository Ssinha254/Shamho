import { useQuery } from "@tanstack/react-query";
import { transactionsService } from "../services/transactions.service";

export const useTransactionDetails = (id: string) => {
  return useQuery({
    queryKey: ["transaction-details", id],
    queryFn: () => transactionsService.getTransactionDetailsById(id),
    enabled: !!id,
  });
};
