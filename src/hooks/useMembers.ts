import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { membersService } from "../services/members.service";

export const useMembers = () => {
  return useQuery({
    queryKey: ["members"],
    queryFn: () => membersService.getMembers(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useMemberById = (id: string) => {
  return useQuery({
    queryKey: ["members", id],
    queryFn: () => membersService.getMemberById(id),
    enabled: !!id,
  });
};

export const useSearchMembers = (query: string) => {
  return useQuery({
    queryKey: ["members", "search", query],
    queryFn: () => membersService.searchMembers(query),
    enabled: !!query && query.length > 0,
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberData) => membersService.createMember(memberData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      membersService.updateMember(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", id] });
    },
  });
};
