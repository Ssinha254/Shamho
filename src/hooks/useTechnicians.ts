import { useQuery } from "@tanstack/react-query";
import { techniciansService } from "../services/technicians.service";

export const useTechnicians = () => {
  return useQuery({
    queryKey: ["technicians"],
    queryFn: () => techniciansService.getTechnicians(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
