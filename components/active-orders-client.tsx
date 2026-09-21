"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ClipboardList, Loader2, RefreshCw, Play, CheckCircle, Truck, XCircle, Pencil } from "lucide-react"
import { toast } from "sonner"
import { EditOrderModal } from "@/components/edit-order-modal"

interface OrderItem {
  productId: string
  productNameSnapshot: string
  unitPrice: number
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
}

const STATUS_COLORS: Record<string, string> = {
  NOVO: "bg-blue-100 text-blue-800 border-blue-300",
  PREPARANDO: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PRONTO: "bg-green-100 text-green-800 border-green-300",
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: "NOVO",
  PREPARANDO: "PREPARANDO",
  PRONTO: "PRONTO",
}

export function ActiveOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editing, setEditing] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/active")
      if (res.ok) {
        const data = await res.json()
        setOrders(data ?? [])
      }
    } catch (err: any) {
      console.error("Fetch orders error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(
          newStatus === "CANCELADO" ? "Pedido cancelado" : "Status atualizado"
        )
        fetchOrders()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? "Erro ao atualizar")
      }
    } catch {
      toast.error("Erro ao atualizar status")
    } finally {
      setUpdating(null)
    }
  }

  const getActionButton = (order: Order) => {
    const isUpdating = updating === order.id
    switch (order.status) {
      case "NOVO":
        return (
          <Button
            onClick={() => updateStatus(order.id, "PREPARANDO")}
            disabled={isUpdating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Iniciar Preparo
          </Button>
        )
      case "PREPARANDO":
        return (
          <Button
            onClick={() => updateStatus(order.id, "PRONTO")}
            disabled={isUpdating}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
            size="lg"
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Marcar como Pronto
          </Button>
        )
      case "PRONTO":
        return (
          <Button
            onClick={() => updateStatus(order.id, "CONCLUIDO")}
            disabled={isUpdating}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
            Confirmar Entrega
          </Button>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando pedidos...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Pedidos Ativos
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os pedidos em andamento</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
        </Button>
      </div>

      {(orders?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhum pedido ativo no momento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(orders ?? []).map((order: Order) => (
            <Card key={order.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-mono">{order.orderNumber}</CardTitle>
                  <Badge className={STATUS_COLORS[order.status] ?? ''}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{order.trackingCode}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-1.5 mb-4">
                  {(order.items ?? []).map((item: OrderItem, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item?.quantity ?? 0}x {item?.productNameSnapshot ?? ''}</span>
                      <span className="font-mono text-muted-foreground">¥{(item?.subtotal ?? 0).toLocaleString('ja-JP')}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                    <span>Total</span>
                    <span className="font-mono">¥{(order.totalAmount ?? 0).toLocaleString('ja-JP')}</span>
                  </div>
                  {order.notes && (
                    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Observações</p>
                      <p className="text-sm text-amber-900 whitespace-pre-wrap break-words">{order.notes}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {getActionButton(order)}
                  {(order.status === "NOVO" || order.status === "PREPARANDO") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setEditing(order)}
                      disabled={updating === order.id}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Editar Pedido
                    </Button>
                  )}
                  {(order.status === "NOVO" || order.status === "PREPARANDO") && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={updating === order.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar o pedido {order.orderNumber}? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Não, manter</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => updateStatus(order.id, "CANCELADO")}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sim, cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <EditOrderModal
          order={{
            id: editing.id,
            orderNumber: editing.orderNumber,
            notes: editing.notes,
            items: (editing.items ?? []).map((i) => ({
              productId: i.productId,
              productNameSnapshot: i.productNameSnapshot,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
            })),
          }}
          onClose={() => setEditing(null)}
          onSaved={fetchOrders}
        />
      )}
    </div>
  )
}
