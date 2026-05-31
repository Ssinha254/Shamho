import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "../services/inventory.service";

export const useInventory = () => {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryService.getBatches(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useInventoryByLocation = (locationId: string) => {
  return useQuery({
    queryKey: ["inventory", locationId],
    queryFn: () => inventoryService.getBatchesByLocation(locationId),
    enabled: !!locationId,
  });
};

export const useLowStockBatches = (threshold: number = 50) => {
  return useQuery({
    queryKey: ["inventory", "low-stock", threshold],
    queryFn: () => inventoryService.getLowStockBatches(threshold),
  });
};

export const useAddStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchId,
      quantity,
    }: {
      batchId: string;
      quantity: number;
    }) => inventoryService.addStock(batchId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};

export const useDamageStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchId,
      quantity,
    }: {
      batchId: string;
      quantity: number;
    }) => inventoryService.damageStock(batchId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};
