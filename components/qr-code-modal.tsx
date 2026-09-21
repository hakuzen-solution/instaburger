"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, QrCode, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const QRCodeSVG = dynamic(
  () => import("react-qr-code").then((mod) => ({ default: mod.default })),
  { ssr: false, loading: () => <div className="w-48 h-48 bg-muted animate-pulse rounded" /> }
)

interface QRCodeModalProps {
  open: boolean
  onClose: () => void
  orderNumber: string
  trackingCode: string
  totalAmount: number
}

export function QRCodeModal({ open, onClose, orderNumber, trackingCode, totalAmount }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false)
  const [showLargeQR, setShowLargeQR] = useState(false)

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/acompanhar/${trackingCode}`
    : `/acompanhar/${trackingCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText?.(trackingCode ?? '')
      setCopied(true)
      toast.success("Código copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Erro ao copiar")
    }
  }

  if (showLargeQR) {
    return (
      <Dialog open={open} onOpenChange={() => { setShowLargeQR(false); onClose(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code - {orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="bg-white p-6 rounded-lg">
              <QRCodeSVG value={trackingUrl} size={280} fgColor="#000000" bgColor="#FFFFFF" />
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">Escaneie para acompanhar o pedido</p>
            <p className="font-mono text-xl font-bold mt-2">{trackingCode}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLargeQR(false)} className="w-full">Voltar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <span>Pedido Criado!</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-display font-bold">{orderNumber}</p>
            <p className="text-muted-foreground text-sm">Número do pedido</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Código de Acompanhamento</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-mono font-bold tracking-wider">{trackingCode}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-mono font-bold">¥{(totalAmount ?? 0).toLocaleString('ja-JP')}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border">
              <QRCodeSVG value={trackingUrl} size={160} fgColor="#000000" bgColor="#FFFFFF" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 gap-1"
              onClick={() => setShowLargeQR(true)}
            >
              <QrCode className="h-4 w-4" />
              Ampliar QR Code
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">Novo Pedido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
