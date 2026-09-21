"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SettingsClient() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("A nova senha e a confirmação não coincidem")
      return
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter ao menos 6 caracteres")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast.success("Senha alterada com sucesso!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? "Erro ao alterar senha")
      }
    } catch {
      toast.error("Erro ao alterar senha")
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    "w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie o acesso do administrador</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            Alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="current" className="text-sm font-medium">Senha atual</label>
              <input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new" className="text-sm font-medium">Nova senha</label>
              <input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
                required
              />
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-medium">Confirmar nova senha</label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
