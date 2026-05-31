import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsService } from "../services/products.service";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => productsService.getProducts(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
