"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function TrackingHome() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code?.trim?.()?.toUpperCase?.() ?? ''
    if (!trimmed) {
      setError("Digite o código de acompanhamento")
      return
    }
    setError("")
    router.push(`/acompanhar/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Ex: 7F4K-92M"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setCode(e.target?.value ?? '')
            setError("")
          }}
          className="pl-10 h-12 text-lg font-mono tracking-wider uppercase"
          autoFocus
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full h-12 text-lg font-semibold">
        <Search className="mr-2 h-5 w-5" />
        Acompanhar Pedido
      </Button>
    </form>
  )
}
