"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, Loader2, CalendarDays, X } from "lucide-react"
import { SafeDate, SafeTime } from "@/components/safe-format"

function toInputDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

interface OrderItem {
  productNameSnapshot: string
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  orderNumber: string
  trackingCode: string
  status: string
  totalAmount: number
  notes: string | null
  items: OrderItem[]
  createdAt: string | null
  completedAt: string | null
}

const STATUS_BADGE: Record<string, string> = {
  CONCLUIDO: "bg-gray-100 text-gray-700",
  CANCELADO: "bg-red-100 text-red-700",
}

export function HistoryClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const qs = params.toString()
      const res = await fetch(`/api/orders/history${qs ? `?${qs}` : ""}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data ?? [])
      }
    } catch (err: any) {
      console.error("Fetch history error:", err)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const setToday = () => {
    const d = toInputDate(new Date())
    setFrom(d)
    setTo(d)
  }

  const setYesterday = () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const s = toInputDate(d)
    setFrom(s)
    setTo(s)
  }

  const setLast7 = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    setFrom(toInputDate(start))
    setTo(toInputDate(end))
  }

  const clearFilter = () => {
    setFrom("")
    setTo("")
  }

  const hasFilter = Boolean(from || to)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Histórico de Pedidos
        </h1>
        <p className="text-muted-foreground mt-1">Pedidos concluídos e cancelados</p>
      </div>

      {/* Filtro por data */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Filtrar por data
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">De</label>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Até</label>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={setToday}>Hoje</Button>
              <Button variant="outline" size="sm" onClick={setYesterday}>Ontem</Button>
              <Button variant="outline" size="sm" onClick={setLast7}>Últimos 7 dias</Button>
              {hasFilter && (
                <Button variant="ghost" size="sm" onClick={clearFilter} className="gap-1 text-muted-foreground">
                  <X className="h-4 w-4" /> Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando histórico...</p>
        </div>
      ) : (orders?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {hasFilter ? "Nenhum pedido encontrado neste período" : "Nenhum pedido no histórico"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(orders ?? []).map((order: Order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg">{order.orderNumber}</span>
                    <Badge className={STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-700'}>
                      {order.status === "CONCLUIDO" ? "CONCLUÍDO" : "CANCELADO"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3">
                    {order.createdAt && (
                      <span className="flex items-center gap-1">
                        <SafeDate date={order.createdAt} options={{ dateStyle: 'short' }} locale="pt-BR" />
                        {' '}
                        <SafeTime date={order.createdAt} options={{ timeStyle: 'short' }} locale="pt-BR" />
                      </span>
                    )}
                    <span className="font-mono font-semibold text-foreground">
                      ¥{(order.totalAmount ?? 0).toLocaleString('ja-JP')}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(order.items ?? []).map((item: OrderItem, i: number) => (
                    <Badge key={i} variant="outline" className="font-normal">
                      {item?.quantity ?? 0}x {item?.productNameSnapshot ?? ''}
                    </Badge>
                  ))}
                </div>
                {order.notes && (
                  <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Observações</p>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap break-words">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
