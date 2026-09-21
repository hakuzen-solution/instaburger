"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Zap, Minus, Plus, Loader2, ShoppingCart, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { QRCodeModal } from "@/components/qr-code-modal"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  category: { id: string; name: string }
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface CreatedOrder {
  orderNumber: string
  trackingCode: string
  totalAmount: number
}

export function QuickOrderClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeCat, setActiveCat] = useState<string>("todos")
  const [cartOpen, setCartOpen] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?active=true")
        if (res.ok) {
          const data = await res.json()
          setProducts(data ?? [])
        }
      } catch (err: any) {
        console.error("Fetch products error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  const getCartQuantity = (productId: string) =>
    cart.find((i) => i.productId === productId)?.quantity ?? 0

  const total = cart.reduce((sum, i) => sum + (i?.price ?? 0) * (i?.quantity ?? 0), 0)
  const totalItems = cart.reduce((sum, i) => sum + (i?.quantity ?? 0), 0)

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Adicione itens ao pedido")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          notes,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCreatedOrder({
          orderNumber: data?.orderNumber ?? "",
          trackingCode: data?.trackingCode ?? "",
          totalAmount: data?.totalAmount ?? 0,
        })
        setShowQR(true)
        setCart([])
        setNotes("")
        setCartOpen(false)
        toast.success("Pedido criado com sucesso!")
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? "Erro ao criar pedido")
      }
    } catch {
      toast.error("Erro ao criar pedido")
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewOrder = () => {
    setCreatedOrder(null)
    setShowQR(false)
  }

  // Build category list
  const catMap = new Map<string, string>()
  ;(products ?? []).forEach((p) => {
    const id = p?.category?.id ?? p?.categoryId ?? "outros"
    const name = p?.category?.name ?? "Outros"
    if (!catMap.has(id)) catMap.set(id, name)
  })
  const cats = Array.from(catMap.entries())

  const visibleProducts = (products ?? []).filter((p) => {
    if (activeCat === "todos") return true
    const id = p?.category?.id ?? p?.categoryId ?? "outros"
    return id === activeCat
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando cardápio...</p>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Modo Rápido
        </h1>
        <p className="text-muted-foreground mt-1">Toque no produto para adicionar. Ideal para a correria.</p>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        <button
          onClick={() => setActiveCat("todos")}
          className={cn(
            "shrink-0 px-5 py-3 rounded-xl text-base font-semibold border-2 transition-colors",
            activeCat === "todos"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border"
          )}
        >
          Todos
        </button>
        {cats.map(([id, name]) => (
          <button
            key={id}
            onClick={() => setActiveCat(id)}
            className={cn(
              "shrink-0 px-5 py-3 rounded-xl text-base font-semibold border-2 transition-colors",
              activeCat === id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border"
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Big product buttons */}
      {visibleProducts.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Nenhum produto disponível nesta categoria.</p>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {visibleProducts.map((product) => {
            const qty = getCartQuantity(product.id)
            return (
              <div
                key={product.id}
                className={cn(
                  "relative rounded-2xl border-2 bg-card overflow-hidden transition-all",
                  qty > 0 ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <button
                  onClick={() => addToCart(product)}
                  className="w-full text-left p-4 min-h-[110px] flex flex-col justify-between active:bg-accent"
                >
                  <span className="font-semibold text-base leading-tight">{product?.name ?? ""}</span>
                  <span className="text-primary font-mono font-bold text-lg mt-2">
                    ¥{(product?.price ?? 0).toLocaleString("ja-JP")}
                  </span>
                </button>

                {qty > 0 && (
                  <div className="flex items-center justify-between border-t-2 border-primary/20 bg-primary/5">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="flex-1 flex items-center justify-center py-3 active:bg-accent"
                      aria-label="Diminuir"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-xl">{qty}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 flex items-center justify-center py-3 active:bg-accent"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => cart.length > 0 && setCartOpen(true)}
            className="flex items-center gap-2 shrink-0"
            aria-label="Ver resumo"
          >
            <div className="relative">
              <ShoppingCart className="h-7 w-7" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="font-mono font-bold text-lg">¥{total.toLocaleString("ja-JP")}</span>
          </button>

          <Button
            className="flex-1 h-14 text-lg font-bold"
            onClick={() => setCartOpen(true)}
            disabled={cart.length === 0}
          >
            Revisar e Confirmar
          </Button>
        </div>
      </div>

      {/* Cart summary sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Resumo do Pedido
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.productId, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-mono font-bold">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.productId, 1)}>
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
                      onClick={() => updateQuantity(item.productId, -(item?.quantity ?? 1))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 space-y-1.5">
                <label htmlFor="quick-order-notes" className="text-sm font-medium">Observações</label>
                <textarea
                  id="quick-order-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Ex.: sem cebola, ponto da carne, recado para a cozinha..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-base resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="font-mono">¥{total.toLocaleString("ja-JP")}</span>
              </div>
              <Button className="w-full h-14 text-lg font-bold" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Criando...</>
                ) : (
                  "Confirmar Pedido"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {createdOrder && (
        <QRCodeModal
          open={showQR}
          onClose={handleNewOrder}
          orderNumber={createdOrder.orderNumber}
          trackingCode={createdOrder.trackingCode}
          totalAmount={createdOrder.totalAmount}
        />
      )}
    </div>
  )
}
