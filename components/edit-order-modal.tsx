"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, X, Loader2, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  price: number
  categoryId: string
  category: { id: string; name: string }
}

interface OrderItemInput {
  productId: string
  productNameSnapshot: string
  unitPrice: number
  quantity: number
}

interface EditOrder {
  id: string
  orderNumber: string
  notes: string | null
  items: OrderItemInput[]
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export function EditOrderModal({
  order,
  onClose,
  onSaved,
}: {
  order: EditOrder
  onClose: () => void
  onSaved: () => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>(
    (order.items ?? []).map((i) => ({
      productId: i.productId,
      name: i.productNameSnapshot,
      price: i.unitPrice,
      quantity: i.quantity,
    }))
  )
  const [notes, setNotes] = useState(order.notes ?? "")
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?active=true")
        if (res.ok) setProducts((await res.json()) ?? [])
      } catch (err: any) {
        console.error("Fetch products error:", err)
      }
    }
    fetchProducts()
  }, [])

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  const addProduct = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id)
      if (existing) {
        return prev.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]
    })
  }

  const total = cart.reduce((sum, i) => sum + (i?.price ?? 0) * (i?.quantity ?? 0), 0)

  const filteredProducts = (products ?? []).filter((p) =>
    (p?.name ?? "").toLowerCase().includes(search.trim().toLowerCase())
  )

  const handleSave = async () => {
    if (cart.length === 0) {
      toast.error("O pedido deve ter ao menos um item")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          notes,
        }),
      })
      if (res.ok) {
        toast.success("Pedido atualizado!")
        onSaved()
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? "Erro ao editar pedido")
      }
    } catch {
      toast.error("Erro ao editar pedido")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold">Editar pedido {order.orderNumber}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Current items */}
        <div className="space-y-2 mb-4">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Nenhum item. Adicione abaixo.</p>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => changeQty(item.productId, -1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-mono font-bold">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => changeQty(item.productId, 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-muted-foreground">
                    ¥{((item?.price ?? 0) * (item?.quantity ?? 0)).toLocaleString("ja-JP")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => changeQty(item.productId, -(item?.quantity ?? 1))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add product */}
        <div className="border-t pt-3 mb-4">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Adicionar produto..."
              className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-left text-sm"
              >
                <span className="truncate">{p.name}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-muted-foreground">¥{(p?.price ?? 0).toLocaleString("ja-JP")}</span>
                  <Plus className="h-4 w-4 text-primary" />
                </span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum produto encontrado.</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 mb-4">
          <label htmlFor="edit-notes" className="text-sm font-medium">Observações</label>
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Ex.: sem cebola, ponto da carne, recado para a cozinha..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center justify-between font-semibold text-lg mb-4">
          <span>Total</span>
          <span className="font-mono">¥{total.toLocaleString("ja-JP")}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button className="flex-1 h-12 font-semibold" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Salvando...</>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
