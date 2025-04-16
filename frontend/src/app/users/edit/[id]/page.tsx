"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUsers } from "@/hooks/useUsers"
import { User } from "@/types/user"

export default function EditUserPage() {
  const { id } = useParams()
  const router = useRouter()
  const { findUser, updateUser, isLoading } = useUsers()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loadingUser, setLoadingUser] = useState(true)
  const [userFetched, setUserFetched] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      setLoadingUser(true)
      try {
        const user = await findUser(id as string)
        if (user) {
          setName(user.name)
          setEmail(user.email)
        }
      } finally {
        setLoadingUser(false)
        setUserFetched(true)
      }
    }
    fetchUser()
  }, [id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const payload = { id, name, email } as User
    if (password) payload.password = password
    updateUser.mutate(payload, {
      onSuccess: () => router.push("/users"),
      onError: () => setError("Erro ao atualizar usuário"),
    })
  }

  if (isLoading || loadingUser || !userFetched) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
        <div className="text-xl text-gray-600 animate-pulse">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6 text-blue-700 text-center">
          Editar Usuário
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="name">
              Nome
            </label>
            <input
              id="name"
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password">
              Senha (deixe em branco para não alterar)
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
              onClick={() => router.push("/users")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
