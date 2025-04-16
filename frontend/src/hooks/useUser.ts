import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { User } from '../types/user'

export const useUser = (id: string | undefined) => {
  return useQuery<User | undefined>({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return undefined
      const { data } = await api.get(`/users/${id}`)
      return data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}
