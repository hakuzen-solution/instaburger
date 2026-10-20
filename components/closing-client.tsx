"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, Loader2, CalendarDays } from "lucide-react"

function toInputDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
}

function formatFull(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function yen(n: number) {
  return `¥${(n ?? 0).toLocaleString("ja-JP")}`
}

function countLabel(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

interface ClosingData {
  from: string
  to: string
  revenue: number
  orderCount: number
  averageTicket: number
  cancelledCount: number
  days: { date: string; orders: number; revenue: number }[]
  products: { name: string; quantity: number; revenue: number }[]
}

export function ClosingClient() {
  const today = toInputDate(new Date())
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [data, setData] = useState<ClosingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!from || !to || from > to) {
      setData(null)
      setError(!from || !to ? "Escolha a data inicial e a final" : "A data inicial deve ser anterior à data final")
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError("")
    fetch(`/api/reports/closing?from=${from}&to=${to}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error ?? "Erro ao calcular o fechamento")
        setData(body)
        setLoading(false)
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") return
        setData(null)
        setError(err?.message ?? "Erro ao calcular o fechamento")
        setLoading(false)
      })
    return () => controller.abort()
  }, [from, to])

  const setRange = (start: Date, end: Date) => {
    setFrom(toInputDate(start))
    setTo(toInputDate(end))
  }

  const setToday = () => setRange(new Date(), new Date())

  const setYesterday = () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    setRange(d, d)
  }

  const setLast7 = () => {
    const start = new Date()
    start.setDate(start.getDate() - 6)
    setRange(start, new Date())
  }

  const setThisMonth = () => {
    const now = new Date()
    setRange(new Date(now.getFullYear(), now.getMonth(), 1), now)
  }

  const maxDayRevenue = data ? Math.max(1, ...data.days.map((d) => d.revenue)) : 1
  const periodLabel = data
    ? data.from === data.to
      ? formatFull(data.from)
      : `${formatFull(data.from)} a ${formatFull(data.to)}`
    : ""

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          Fechamento
        </h1>
        <p className="text-muted-foreground mt-1">
          Faturamento do período. Pedidos cancelados não entram na soma; pedidos em andamento entram.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Período
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="closing-from" className="text-xs text-muted-foreground">De</label>
              <input
                id="closing-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="closing-to" className="text-xs text-muted-foreground">Até</label>
              <input
                id="closing-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={setToday}>Hoje</Button>
              <Button variant="outline" size="sm" onClick={setYesterday}>Ontem</Button>
              <Button variant="outline" size="sm" onClick={setLast7}>Últimos 7 dias</Button>
              <Button variant="outline" size="sm" onClick={setThisMonth}>Este mês</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Calculando...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">{error}</CardContent>
        </Card>
      ) : data && data.orderCount === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhum pedido em {periodLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {data.cancelledCount > 0
                ? `${countLabel(data.cancelledCount, "pedido cancelado não conta", "pedidos cancelados não contam")}. `
                : ""}
              Escolha outras datas para ver o faturamento.
            </p>
          </CardContent>
        </Card>
      ) : data ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Faturamento de {periodLabel}</p>
              <p className="mt-1 font-mono font-bold tracking-tight text-4xl sm:text-6xl break-all">
                {yen(data.revenue)}
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Pedidos</dt>
                  <dd className="font-mono font-semibold text-lg">{data.orderCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Ticket médio</dt>
                  <dd className="font-mono font-semibold text-lg">{yen(data.averageTicket)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Cancelados (fora da soma)</dt>
                  <dd className="font-mono font-semibold text-lg">{data.cancelledCount}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {data.days.length > 1 && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-base font-display">Por dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {data.days.map((d) => (
                    <li key={d.date} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium">{formatDay(d.date)}</p>
                        <p className="text-xs text-muted-foreground">{countLabel(d.orders, "pedido", "pedidos")}</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted" aria-hidden="true">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(2, (d.revenue / maxDayRevenue) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-sm">{yen(d.revenue)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.products.length > 0 && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-base font-display">Por produto</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {data.products.map((p) => (
                    <li key={p.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5 text-sm">
                      <span className="break-words">{p.name}</span>
                      <span className="font-mono text-muted-foreground">{p.quantity}x</span>
                      <span className="font-mono font-semibold w-24 text-right">{yen(p.revenue)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}
