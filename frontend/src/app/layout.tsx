import "../styles/globals.css"
import { ReactNode } from "react"
import QueryProvider from "@/lib/QueryProvider"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
