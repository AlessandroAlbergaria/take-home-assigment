"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch(`http://localhost:3000/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error("Login inválido")
      const data = await res.json()
      localStorage.setItem("access_token", data.access_token)
      router.push("/users")
    } catch {
      setError("Email ou senha inválidos. Tente novamente.")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-green-300 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-extrabold mb-2 text-green-700">
          Bem-vindo de volta
        </h1>
        <p className="mb-6 text-gray-500">Acesse sua conta para continuar</p>
        {error && (
          <div className="mb-4 w-full bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-center animate-shake">
            {error}
          </div>
        )}
        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Seu email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-1" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Entrar
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-gray-600">Não tem uma conta? </span>
          <a
            href="/register"
            className="text-green-600 hover:underline font-medium"
          >
            Criar conta
          </a>
        </div>
      </div>
    </div>
  )
}
