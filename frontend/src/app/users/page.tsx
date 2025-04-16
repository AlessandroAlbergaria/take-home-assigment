"use client"

import { useUsers } from "@/hooks/useUsers"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function UsersPage() {
  const { users, isLoading, deleteUser } = useUsers()
  const router = useRouter()
  const [loggedUserId, setLoggedUserId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]))
          setLoggedUserId(payload.sub)
        } catch {
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
    }
  }, [router])

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
        <div className="text-xl text-gray-600 animate-pulse">
          Carregando usuários...
        </div>
      </div>
    )

  if (!users || users.length === 0)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <h1 className="text-2xl font-bold mb-2 text-blue-700">Usuários</h1>
          <p className="text-gray-500">Nenhum usuário encontrado.</p>
        </div>
      </div>
    )

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-700 text-center">
            Usuários
          </h1>
          <div className="flex gap-2">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              onClick={() => router.push("/users/create")}
            >
              Criar Usuário
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold border border-gray-300 transition-colors"
              onClick={() => {
                localStorage.removeItem("access_token")
                router.push("/login")
              }}
            >
              Sair
            </button>
          </div>
        </div>
        <ul className="space-y-4">
          {users.map((user) => (
            <li
              key={user.id}
              className="p-6 border border-gray-200 rounded-xl shadow-md bg-gradient-to-r from-blue-50 to-green-50 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                  {user.name}
                </p>
                <p className="text-gray-500">{user.email}</p>
                <span className="mt-1 inline-block bg-gradient-to-r from-blue-200 to-green-200 text-blue-900 px-2 py-0.5 rounded text-xs font-semibold tracking-wide shadow-sm">
                  Id: {user.id}
                </span>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded font-medium shadow"
                  onClick={() => router.push(`/users/edit/${user.id}`)}
                >
                  Editar
                </button>
                {user.id !== loggedUserId && (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-medium shadow"
                    onClick={() => user.id && setConfirmDeleteId(user.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-xs text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">
              Confirmar exclusão
            </h2>
            <p className="mb-6">Tem certeza que deseja excluir este usuário?</p>
            <div className="flex gap-2 justify-center">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => {
                  deleteUser.mutate(confirmDeleteId)
                  setConfirmDeleteId(null)
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
