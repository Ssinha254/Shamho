import { useQuery } from "@tanstack/react-query";
import { locationsService } from "../services/locations.service";

export const useLocations = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsService.getLocations(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
