"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Clock, ChefHat, CheckCircle2, XCircle, Package, Bell, BellOff } from "lucide-react"

// Som distinto por status (sequência de notas em Hz)
const STATUS_SOUND: Record<string, { notes: number[]; duration: number; vibrate: number[] }> = {
  NOVO: { notes: [523.25], duration: 0.15, vibrate: [100] },
  PREPARANDO: { notes: [523.25, 659.25], duration: 0.15, vibrate: [120, 60, 120] },
  PRONTO: { notes: [659.25, 783.99, 1046.5], duration: 0.22, vibrate: [200, 80, 200, 80, 200] },
  CONCLUIDO: { notes: [783.99, 523.25], duration: 0.18, vibrate: [150] },
  CANCELADO: { notes: [392.0, 329.63], duration: 0.25, vibrate: [300] },
}

interface TrackingItem {
  productNameSnapshot: string
  unitPrice: number
  quantity: number
  subtotal: number
}

interface TrackingOrder {
  orderNumber: string
  trackingCode: string
  status: string
  totalAmount: number
  items: TrackingItem[]
  createdAt: string | null
  completedAt: string | null
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; message: string; color: string; bgColor: string }> = {
  NOVO: {
    icon: <Clock className="h-8 w-8" />,
    label: "Pedido recebido",
    message: "Aguarde o início do preparo.",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  PREPARANDO: {
    icon: <ChefHat className="h-8 w-8" />,
    label: "PEDIDO EM PREPARO",
    message: "Seu pedido está sendo preparado.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
  PRONTO: {
    icon: <Package className="h-8 w-8" />,
    label: "PEDIDO PRONTO!",
    message: "Retire seu pedido no balcão.",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  CONCLUIDO: {
    icon: <CheckCircle2 className="h-8 w-8" />,
    label: "PEDIDO ENTREGUE",
    message: "Obrigado pela preferência!",
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
  },
  CANCELADO: {
    icon: <XCircle className="h-8 w-8" />,
    label: "PEDIDO CANCELADO",
    message: "Entre em contato com o atendente.",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
  },
}

export function TrackingStatus({ code }: { code: string }) {
  const [order, setOrder] = useState<TrackingOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [alertsOn, setAlertsOn] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const prevStatusRef = useRef<string | null>(null)
  const alertsOnRef = useRef(false)

  useEffect(() => {
    alertsOnRef.current = alertsOn
  }, [alertsOn])

  const playStatusSound = useCallback((status: string) => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const cfg = STATUS_SOUND[status] ?? STATUS_SOUND.NOVO
    try {
      if (ctx.state === "suspended") ctx.resume()
      let startAt = ctx.currentTime
      cfg.notes.forEach((freq) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.0001, startAt)
        gain.gain.exponentialRampToValueAtTime(0.4, startAt + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + cfg.duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startAt)
        osc.stop(startAt + cfg.duration)
        startAt += cfg.duration
      })
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(cfg.vibrate)
      }
    } catch (e) {
      console.error("Sound error:", e)
    }
  }, [])

  const enableAlerts = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext
        audioCtxRef.current = new AC()
      }
      audioCtxRef.current?.resume?.()
      // Toca um som curto de confirmação ao ativar
      playStatusSound("NOVO")
      setAlertsOn(true)
    } catch (e) {
      console.error("Enable alerts error:", e)
    }
  }, [playStatusSound])

  const disableAlerts = useCallback(() => {
    setAlertsOn(false)
  }, [])

  useEffect(() => {
    if (!code) return

    let mounted = true
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/tracking/${encodeURIComponent(code)}`)
        if (!mounted) return
        if (!res.ok) {
          setError("Pedido não encontrado. Verifique o código e tente novamente.")
          setOrder(null)
          setLoading(false)
          return
        }
        const data = await res.json()
        // Detecta mudança de status e toca som se alertas ativos
        const newStatus = data?.status ?? null
        if (
          alertsOnRef.current &&
          prevStatusRef.current &&
          newStatus &&
          newStatus !== prevStatusRef.current
        ) {
          playStatusSound(newStatus)
        }
        prevStatusRef.current = newStatus
        setOrder(data)
        setError("")
        setLoading(false)
      } catch {
        if (mounted) {
          setError("Erro ao buscar pedido. Tente novamente.")
          setLoading(false)
        }
      }
    }

    fetchOrder()
    const interval = setInterval(fetchOrder, 5000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [code, playStatusSound])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Buscando pedido...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-lg font-medium">{error}</p>
      </div>
    )
  }

  if (!order) return null

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NOVO

  return (
    <div className="space-y-4">
      {/* Botão de alertas sonoros */}
      {order.status !== "CONCLUIDO" && order.status !== "CANCELADO" && (
        alertsOn ? (
          <Button
            variant="outline"
            className="w-full gap-2 border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
            onClick={disableAlerts}
          >
            <Bell className="h-4 w-4" />
            Alertas sonoros ativados
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={enableAlerts}
          >
            <BellOff className="h-4 w-4" />
            Ativar alertas sonoros
          </Button>
        )
      )}

      {/* Status Card */}
      <Card className={`border-2 ${statusCfg.bgColor}`}>
        <CardContent className="pt-6 text-center">
          <div className={`${statusCfg.color} flex justify-center mb-3`}>
            {statusCfg.icon}
          </div>
          <h2 className={`text-xl font-bold font-display ${statusCfg.color}`}>
            {statusCfg.label}
          </h2>
          <p className="text-muted-foreground mt-1">{statusCfg.message}</p>
        </CardContent>
      </Card>

      {/* Order Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pedido {order.orderNumber}</CardTitle>
            <Badge variant="outline" className="font-mono text-sm">
              {order.trackingCode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {(order.items ?? []).map((item: TrackingItem, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span>
                  {item?.quantity ?? 0}x {item?.productNameSnapshot ?? 'Item'}
                </span>
                <span className="font-mono text-muted-foreground">
                  ¥{(item?.subtotal ?? 0).toLocaleString('ja-JP')}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-semibold">
            <span>Total</span>
            <span className="font-mono text-lg">¥{(order.totalAmount ?? 0).toLocaleString('ja-JP')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
