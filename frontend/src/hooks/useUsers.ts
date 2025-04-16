import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { User } from "@/types/user"

export const useUsers = () => {
  const queryClient = useQueryClient()

  const fetchUsers = async (): Promise<User[]> => {
    const { data } = await api.get("/users")
    return data
  }

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const createUser = useMutation({
    mutationFn: (user: { name: string; email: string; password: string }) =>
      api.post("/users", user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })

  const updateUser = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id?: string
      name: string
      email: string
      password?: string
    }) => api.patch(`/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })

  const findUser = async (id: string): Promise<User | undefined> => {
    const { data } = await api.get(`/users/${id}`)
    return data
  }

  return {
    users: data,
    isLoading,
    createUser,
    deleteUser,
    updateUser,
    findUser,
  }
}
