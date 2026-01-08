"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, AuthSession } from "@/lib/auth-types"
import { useRouter } from "next/navigation"
import { initializePermissions } from "@/config/permissions"

interface AuthContextType {
  user: Omit<User, "password"> | null
  login: (email: string, pass: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY_SESSION = "aws_reports_session"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Restore session from localStorage
    const sessionStr = localStorage.getItem(STORAGE_KEY_SESSION)
    if (sessionStr) {
      try {
        const session: AuthSession = JSON.parse(sessionStr)
        if (new Date(session.expires) > new Date()) {
          setUser(session.user)
        } else {
          localStorage.removeItem(STORAGE_KEY_SESSION)
        }
      } catch (e) {
        console.error("Failed to parse session", e)
      }
    }
    initializePermissions().catch(console.error)
    setIsLoading(false)
  }, [])

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      })

      if (!response.ok) {
        return false
      }

      const session: AuthSession = await response.json()
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session))
      setUser(session.user)

      await initializePermissions()

      return true
    } catch (error) {
      console.error("[v0] Login error:", error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_SESSION)
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
