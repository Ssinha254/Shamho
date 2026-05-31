import { useQuery } from "@tanstack/react-query";
import { aiService } from "../services/ai.service";

export const useAIAnalytics = () => {
  return useQuery({
    queryKey: ["ai-analytics"],
    queryFn: () => aiService.getAIAnalytics(),
  });
};
